<?php
namespace Kachkaev\CountersBundle\Twig;
use Symfony\Component\DependencyInjection\ContainerInterface;

use Twig_Extension;
use Twig_Filter_Method;
use Twig_Function_Method;

class CountersExtension extends Twig_Extension
{
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function getFunctions()
    {
        $functions = array();

        $mappings = array('getCounterId' => 'getCounterId', 'countersDisabled' => 'countersDisabled',);

        foreach ($mappings as $twigFunction => $method) {
            $functions[$twigFunction] = new Twig_Function_Method($this, $method);
        }

        $safeMappings = array();

        foreach ($safeMappings as $twigFunction => $method) {
            $functions[$twigFunction] = new Twig_Function_Method($this, $method, array('is_safe' => array('html')));
        }

        return $functions;
    }

    public function countersDisabled()
    {
        return $this->container->getParameter('kachkaev_counters.disabled');
    }

    public function getCounterId($name)
    {
        return $this->container->getParameter("kachkaev_counters.$name.id");
    }

    public function getName()
    {
        return 'KachkaevCountersExtension';
    }
}