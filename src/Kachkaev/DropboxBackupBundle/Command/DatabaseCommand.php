<?php

namespace Kachkaev\DropboxBackupBundle\Command;

use Kachkaev\DropboxBackupBundle\DependencyInjection\Configuration;

use Doctrine\Bundle\DoctrineBundle\Registry;

use Kachkaev\DropboxBackupBundle\DropboxUploader;

use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\Output;

class DatabaseCommand extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('dropboxbackup:database')
            ->setDescription('Backups database to dropbox')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {

    	// 
    	// See http://ericsilva.org/2012/07/05/backup-mysql-database-to-dropbox/
    	//

    	// location of your temp directory
    	$tmpDir = $this->getContainer()->getParameter('kernel.cache_dir')."/db/";
    	if (!file_exists($tmpDir))
    		mkdir($tmpDir);
    	// username for MySQL
    	$user = $this->getContainer()->getParameter("kachkaev_dropbox_backup.database_user");
    	// password for MySQL
    	$password = $this->getContainer()->getParameter("kachkaev_dropbox_backup.database_password");
    	// database name to backup
    	$dbName = $this->getContainer()->getParameter("kachkaev_dropbox_backup.database_name");
    	
    	// the zip file emailed to you will have this prefixed
    	$prefix = $this->getContainer()->getParameter("kachkaev_dropbox_backup.dropbox_fileprefix");
    	
    	// username for Dropbox
    	$dropbox_user = $this->getContainer()->getParameter("kachkaev_dropbox_backup.dropbox_user");
    	// password for Dropbox
    	$dropbox_password = $this->getContainer()->getParameter("kachkaev_dropbox_backup.dropbox_password");
    	// Destination folder in Dropbox (folder will be created if doesn't yet exist)
    	$dropbox_dest = $this->getContainer()->getParameter("kachkaev_dropbox_backup.dropbox_directory");
    	 
    	// Create the database backup file
    	$sqlFileName = $prefix.date('Y_m_d_H_i_s').".sql";
    	$sqlFile = $tmpDir.$sqlFileName;
    	$backupFilename = $prefix.date('Y_m_d_H_i_s').".tgz";
    	$backupFile = $tmpDir.$backupFilename;
    	
    	$createBackup = "mysqldump -u ".$user." --password=".$password." ".$dbName." > ".$sqlFile;
    	//echo $createBackup;
    	$createZip = "tar cvzf $backupFile -C $tmpDir $sqlFileName 2>/dev/null";
    	//echo $createZip;
    	exec($createBackup, $out);
    	exec($createZip, $out);
    	
    	// Upload database backup to Dropbox
    	$uploader = new DropboxUploader($dropbox_user, $dropbox_password);
    	$uploader->upload($backupFile, $dropbox_dest,  $backupFilename);
    	
    	// Delete the temporary files
    	unlink($sqlFile);
    	unlink($backupFile);
    	
    	$output->writeln('Done.');
    }
}