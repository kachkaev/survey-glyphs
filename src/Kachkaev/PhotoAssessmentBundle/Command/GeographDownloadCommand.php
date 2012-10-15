<?php

namespace Kachkaev\PhotoAssessmentBundle\Command;

use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class GeographDownloadCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('geograph:download')
            ->setDescription('Downloads geograph images')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
    	
    	$dir = $this->getContainer()->getParameter('pat.geograph_dir');
    	if (!file_exists($dir))
    		mkdir($dir, 0777, true);
    	
    	$idsStmt = $this->getContainer()->get('doctrine.orm.entity_manager')->getConnection()->query("SELECT photoId FROM Photo WHERE status = 0 AND source = 'geograph'");
    	$idsStmt->execute();
    	$idsRes = $idsStmt->fetchAll();
    	
    	$sequence = 0;
    	foreach ($idsRes as $idRes) {
    		$id = $idRes['photoId'];
    		++$sequence;
    		
    		if ($sequence % 10 == 0)
    			$output->write(".");
    		
    		$distFilename = $dir . "/$id.jpg";
    		if (file_exists($distFilename))
				continue;
    		$page = file_get_contents("http://www.geograph.org.uk/photo/$id");
    		
    		$imageUrlMatch;
    		preg_match("/http\:\/\/[a-z0-9]+\.geograph\.org\.uk\/(geophotos|photos)\/([\d]+\/)+${id}_[a-z0-9]{8}\.jpg/", $page, $imageUrlMatch);
    		
    		if (!sizeof($imageUrlMatch))
    			throw new \Exception("Could not find photo for id = $id");
    		
    		copy($imageUrlMatch[0], $distFilename);
    	}
    	
    	$output->writeln('');
    	$output->writeln('Done.');
    }
}
