<?php
namespace Kachkaev\PhotoAssessmentBundle\Listener;

use Symfony\Component\Routing\RouterInterface;

use Symfony\Component\Security\Core\SecurityContext;

use Symfony\Component\HttpFoundation\Response;

use Kachkaev\PhotoAssessmentBundle\Helper\UserRememberer;

use Doctrine\ORM\EntityManager;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;

/**
 * Replaces user with the one having an id passed via GET
 *
 */
class LogoutBackdoorListener 
{
    protected $userRememberer;
    protected $backdoorSecret;
    protected $router;
    
    public function __construct(UserRememberer $userRememberer, RouterInterface $router, $backdoorSecret)
    {
        $this->userRememberer = $userRememberer;
        $this->backdoorSecret = $backdoorSecret;
        $this->router = $router;
    }
    
    public function onKernelRequest(GetResponseEvent $event)
    {
        // Checking if command is logout
        if (!$event->getRequest()->query->has('logout')) {
            return;
        }
        
        $backdoorSecret = $event->getRequest()->query->get('s');
        
        // Checking backdoor security
        if ($backdoorSecret !== $this->backdoorSecret) {
            $event->setResponse(new Response("Wrong value for backdoor_secret"));
            return;
        }
        
        // Logging out
        $response = new RedirectResponse($this->router->generate('pat_default_index'));
        $this->userRememberer->forgetUser($event->getRequest(), $response);
        $event->getRequest()->getSession()->invalidate();
        
        // Redirecting
        $event->setResponse($response);
    }
}
