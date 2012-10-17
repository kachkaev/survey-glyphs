<?php
namespace Kachkaev\CountersBundle\Listener;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;

/**
 * If /?counters_off or /?counters_on present in the request, counters_off cookie is set/unset
 *
 */
class CountersOnOffListener
{
    public function onKernelRequest(GetResponseEvent $event)
    {
        // Setting counters_off cookie
        if ($event->getRequest()->get('counters_off') !== null) {

            $event->getRequest()->getSession()->setFlash('counters', 'off');

            $cleanURI = str_replace('?counters_off', '', $event->getRequest()->server->get('REQUEST_URI'));
            $response = new RedirectResponse($cleanURI);
            $cookie = new Cookie('counters_off', true, '2030-01-01', '/', null, null, false);
            $response->headers->setCookie($cookie);
            $event->setResponse($response);
        }

        // Deleting counters_off cookie
        if ($event->getRequest()->get('counters_on') !== null) {

            $event->getRequest()->getSession()->setFlash('counters', 'on');

            $cleanURI = str_replace('?counters_on', '', $event->getRequest()->server->get('REQUEST_URI'));
            $response = new RedirectResponse($cleanURI);
            $cookie = new Cookie('counters_off');
            $response->headers->setCookie($cookie);
            $event->setResponse($response);
        }

    }
}
