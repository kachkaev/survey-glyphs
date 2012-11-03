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

class StatsDeleteCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this->setName('pat:stats:delete')
                ->setDescription('Deletes photo and user stats')
                ->addArgument('timestamp', InputArgument::OPTIONAL,
                        'Timestamp for which stats should be deleted (leave empty to delete all stats)',
                        null)
                ->addOption('force', null, InputOption::VALUE_NONE,
                        'Disables confirmation prompt.');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $timestamp = $input->getArgument('timestamp');
        $statsManger = $this->getContainer()->get('pat.stats.manager');

        if (is_null($timestamp) && !$input->getOption('force')) {
            $dialog = $this->getHelperSet()->get('dialog');
            if (!$dialog
                    ->askConfirmation($output,
                            '<question>Are you sure you want to delete all stats (y/n)?</question>',
                            false)) {
                return;
            }
        }

        if ($timestamp) {

            $timestampHR = date("Y-m-d H:i:s", $timestamp);

            if (!$statsManger->statsExistFor($timestamp)) {
                throw new RuntimeException(
                        "Cannot delete stats for $timestamp ($timestampHR) as they don’t exist");
            }

            $output
                    ->writeln(
                            "Deleting stats for <info>$timestamp</info> (<info>$timestampHR</info>)...");
        } else {
            $output->writeln("Deleting <info>all</info> stats...");

        }

        $statsManger->delete($timestamp);

        $output->writeln('Done.');
    }
}
