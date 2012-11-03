<?php

namespace Kachkaev\PhotoAssessmentBundle\Command;

use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class StatsListTimestampsCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('pat:stats:list_timestamps')
            ->setDescription('Lists all timestamps for wich stats exist')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        
        $statsManger = $this->getContainer()->get('pat.stats.manager');
    	$timestamps = $statsManger->listTimestamps();
    	
    	if (sizeof($timestamps)) {
        	foreach($timestamps as $timestamp) {
        	    $output->writeln(str_pad($timestamp, 10, '0', STR_PAD_LEFT).'    <comment>'.date('Y-m-d H:i:s', $timestamp).'</comment>');
        	}
    	} else {
    	    $output->writeln('<info>List of timestamps is empty (no stats are collected yet).</info>');
    	}
    }
}
