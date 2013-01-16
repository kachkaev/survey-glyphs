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

class PhotoPrioritiesUpdateCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this->setName('pat:photo_priorities:update')
                ->setDescription('Updates photo priorities based on latest stats (or stats with given timestamp)')
                ->addArgument('timestamp', InputArgument::OPTIONAL,
                        'Timestamp for which stats should be taken to from the priorities',
                        null)
            ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $timestamp = $input->getArgument('timestamp');
        
        if (!$timestamp) {
            $sm = $this->getContainer()->get('pat.stats.manager');
            $timestamps = $sm->listTimestamps();
            if (!count($timestamps)) {
                $output->writeln('<error>No precalculated statistics are found in the database. Please run pat:stats:calclulate first as this is required for updating photo priorities.</error>');
                return;
            }
            $timestamp = end($timestamps);
        }

        $timestampHR = date("Y-m-d H:i:s", $timestamp);
        $output->write(sprintf('Updating photo priorities based on statistics at <info>%s</info>...', $timestampHR));
        
        $ppm = $this->getContainer()->get('pat.photo_priorities.manager');
        $ppm->updatePhotoPriorities($timestamp);

        $output->writeln(' Done.');
    }
}
