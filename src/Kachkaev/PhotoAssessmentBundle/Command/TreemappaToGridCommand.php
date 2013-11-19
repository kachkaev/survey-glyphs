<?php

namespace Kachkaev\PhotoAssessmentBundle\Command;
use JMS\AopBundle\Exception\RuntimeException;

use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class TreemappaToGridCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this->setName('pat:treemappa_to_grid')
                ->setDescription('Updates photo priorities based on latest stats (or stats with given timestamp)')
                ->addArgument('csv', InputArgument::REQUIRED,
                        'Location of the csv file',
                        null)
                ->addArgument('width', InputArgument::REQUIRED,
                        'width of the treemappa image',
                        null)
                ->addArgument('height', InputArgument::REQUIRED,
                        'height of the treemappa image',
                        null)
                ->addArgument('columns', InputArgument::REQUIRED,
                        'number of columns',
                        null)
                ->addArgument('rows', InputArgument::REQUIRED,
                        'number of rows',
                        null)
                ->addArgument('indent', InputArgument::OPTIONAL,
                        'Number of spaces before output entries divided by 4 (e.g. 1 => 4 space, 2 => 8 spaces)',
                        1)
            ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $csv = $input->getArgument('csv');
        $width = (int)$input->getArgument('width');
        $height = (int)$input->getArgument('height');
        $columns = (int)$input->getArgument('columns');
        $rows = (int)$input->getArgument('rows');
        $indent = (int)$input->getArgument('indent');
        
        $csvContents = file_get_contents($csv);
        
        $result = [];
        foreach(explode("\n", $csvContents) as $csvLine) {
            
            if (!$csvLine) {
                continue;
            }
            $csvValues = explode(',', $csvLine);
            $id = (int)str_replace('"', '', $csvValues[0]);
            $xMin = (int)$csvValues[1];
            $yMin = (int)$csvValues[2];
            
            $col = round ( $xMin / ($width / $columns));
            $row = round ( $yMin / ($height / $rows));
            
            $result [$id] = [$col, $row];
        };
        
        ksort($result);
        
        foreach($result as $resultElemKey => $resultElem) {
            $output->writeln(sprintf('<comment>%s%d: [ %d, %d]</comment>', str_repeat('    ', $indent), $resultElemKey, $resultElem[0], $resultElem[1]));
        }
    }
}
