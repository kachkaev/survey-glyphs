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

class PhotoPrioritiesResetCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this->setName('pat:photo_priorities:reset')
                ->setDescription('Resets photo priorities')
            ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $output->write("Deleting photo priorities...");
        
        $ppm = $this->getContainer()->get('pat.photo_priorities.manager');
        $ppm->resetPhotoPriorities();

        $output->writeln(' Done.');
    }
}
