<?php

namespace Kachkaev\PhotoAssessmentBundle\Command;

use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class StatsDeleteCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('pat:stats:delete')
            ->setDescription('Deletes photo and user stats')
            ->addArgument('timestamp', InputArgument::OPTIONAL, 'Timestamp for which stats should be deleted (leave empty to delete all stats)', null)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
    	$output->writeln('Deleting stats...');
    	
        $statsManger = $this->getContainer()->get('pat.stats.manager');
    	$statsManger->delete($input->getArgument('timestamp'));

    	$output->writeln('Done.');
    }
}
