<?php

namespace Kachkaev\CountersBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\ArrayNodeDefinition;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * This is the class that validates and merges configuration from your app/config files
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html#cookbook-bundles-extension-config-class}
 */
class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritDoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('kachkaev_counters');

        $rootNode
            -> children()
                ->booleanNode('disabled')->defaultFalse()->end()
            ->end();

        $this->addCounter('google_analytics', $rootNode);
        $this->addCounter('yandex_metrika', $rootNode);

        /*
        ->children()
        ->arrayNode('economics')
        ->children()
        ->scalarNode('nds')->isRequired()->end()
        ->arrayNode('currencies')
        ->isRequired()
        ->prototype('scalar')->end()
        ->defaultValue(array())
        ->end()
        ->arrayNode('currency_exchange')
        ->canBeUnset()
        ->addDefaultsIfNotSet()
        ->children()
        ->scalarNode('date')->defaultNull()->end()
        ->arrayNode('rates')
        ->useAttributeAsKey('name')
        ->prototype('scalar')->end()
        ->defaultValue(array())
        ->end()
        ->end()
        ->end()
        ->end()
        ->end()
        ->end()
        ->end();*/

        // Here you should define the parameters that are allowed to
        // configure your bundle. See the documentation linked above for
        // more information on that topic.

        return $treeBuilder;
    }

    protected function addCounter($name, ArrayNodeDefinition $rootNode) {
        $rootNode
            ->children()
                ->arrayNode($name)
                    ->children()
                        ->scalarNode('id')->defaultNull()
                    ->end()
                ->end()
            ->end();
    }
}
