<?php
namespace Kachkaev\PhotoAssessmentBundle\Listener;

use Symfony\Component\HttpFoundation\Response;

use Kachkaev\PhotoAssessmentBundle\Helper\UserRememberer;

use Doctrine\ORM\EntityManager;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;

/**
 * Replaces user with the one having an id passed via GET
 *
 */
class SwitchUserBackdoorListener 
{
    protected $em;
    protected $userRememberer;
    protected $backdoorSecret;
    
    public function __construct(EntityManager $em, UserRememberer $userRememberer, $backdoorSecret)
    {
        $this->em = $em;
        $this->userRememberer = $userRememberer;
        $this->backdoorSecret = $backdoorSecret;
        
    }
    
    public function onKernelRequest(GetResponseEvent $event)
    {
        // If switch user backdoor is used, changing user
        $backdoorUserId = $event->getRequest()->query->get('u');
        $backdoorSecret = $event->getRequest()->query->get('s');
        
        if (!$backdoorUserId || !$backdoorSecret)
            return;
        
        // Checking backdoor security
        if ($backdoorSecret !== $this->backdoorSecret) {
            $event->setResponse(new Response("Wrong value for backdoor_secret"));
            return;
        }
        
        $user = $this->em->getRepository('Kachkaev\PhotoAssessmentBundle\Entity\User')->findOneById($backdoorUserId);
        
        if (!$user) {
            $event->setResponse(new Response("User with id = $backdoorUserId not found"));
            return;
        }
        
        $newQuery = $event->getRequest()->query->all();
        unset($newQuery['u']);
        unset($newQuery['s']);
        $newRequest = $event->getRequest()->duplicate();
        $newRequest->server->set('QUERY_STRING',  http_build_query($newQuery));
        
        $response = new RedirectResponse($newRequest->getUri());
                
        $this->userRememberer->rememberUser($user, $event->getRequest(), $response);
        
        $event->setResponse($response);
    }
}
