<?php

namespace Kachkaev\PhotoAssessmentBundle\Command;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class StatsCalculateCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this->setName('pat:stats:calculate')
                ->setDescription('Calculates photo and user stats')
                ->addArgument('timestamp', InputArgument::OPTIONAL,
                        'Timestamp for which stats should be calculated (leave empty to get up-to-date stats)',
                        null)
                ->addOption('force', null, InputOption::VALUE_NONE, 'Forces stats override even if they already exist for a given time.')
                ->addOption('precise', null, InputOption::VALUE_NONE, 'Avoid rounding timestamp to nearest minute in the past.')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $timestamp = $input->getArgument('timestamp');
        $statsManger = $this->getContainer()->get('pat.stats.manager');

        if ($timestamp === null) {
            $timestamp = (int)time();
            if (!$input->getOption('precise')) {
                $timestamp = (int)(floor($timestamp / 60) * 60);
            }
        } else if (!is_numeric($timestamp)) {
            $timestamp = strtotime($timestamp);
        }
        
        $timestampHR = date("Y-m-d H:i:s", $timestamp);
        
        if ($statsManger->statsExistFor($timestamp) && !$input->getOption('force')) {
            $dialog = $this->getHelperSet()->get('dialog');
            if ($input->isInteractive() && !$dialog
                    ->askConfirmation($output,
                            '<question>Stats already exist for this time. Overwrite them (y/n)?</question>',
                            false)) {
                return;
            }
        }

        $output
                ->write(
                        "Calculating stats for <info>$timestamp</info> (<info>$timestampHR</info>)...");

        $statsManger->calculate($timestamp);

        $output->writeln(' Done.');
    }
}
