<?php

namespace Kachkaev\DropboxBackupBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\Loader;

/**
 * This is the class that loads and manages your bundle configuration
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html}
 */
class KachkaevDropboxBackupExtension extends Extension
{
    /**
     * {@inheritDoc}
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $loader = new Loader\YamlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config'));
        $loader->load('config.yml');

        $container->setParameter('kachkaev_dropbox_backup.database_user', $config['database']['user']);
        $container->setParameter('kachkaev_dropbox_backup.database_password', $config['database']['password']);
        $container->setParameter('kachkaev_dropbox_backup.database_name', $config['database']['name']);

        $container->setParameter('kachkaev_dropbox_backup.dropbox_user', $config['dropbox']['user']);
        $container->setParameter('kachkaev_dropbox_backup.dropbox_password', $config['dropbox']['password']);
        $container->setParameter('kachkaev_dropbox_backup.dropbox_directory', $config['dropbox']['directory']);
        $container->setParameter('kachkaev_dropbox_backup.dropbox_fileprefix', $config['dropbox']['fileprefix']);
    }
}
