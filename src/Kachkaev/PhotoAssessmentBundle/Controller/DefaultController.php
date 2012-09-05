<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

use Symfony\Component\Security\Http\RememberMe\TokenBasedRememberMeServices;

use Symfony\Bridge\Doctrine\Security\User\EntityUserProvider;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

use Kachkaev\PhotoAssessmentBundle\Entity\User;

use Symfony\Component\Security\Core\User\UserInterface;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="pat_default_index")
     * @Template(vars={""})
     */
    public function indexAction()
    {
    }
    
//     * @Route("/survey/{photoSource}", defaults={"photoId" = null}, name="pat_default_survey")
//     * @Route("/survey/{photoSource}/{photoId}", name="pat_default_survey_photo")
    
    /**
     * @Route("/survey/", name="pat_default_survey")
     * @Template(vars={""})
     */
    public function surveyAction()
    {
    	$response = new Response();
    	
    	
    	// If user is not authorised, authorising
    	$user = $this->get('security.context')->getToken()->getUser();
    	if (!($user instanceof UserInterface)) {
    		$user = new User();
    		$em = $this->get("doctrine.orm.entity_manager");
    		$em->persist($user);
    		$em->flush();
    		
    		$token = new UsernamePasswordToken($user, null, 'main', $user->getRoles());
    		$this->get('security.context')->setToken($token);
    		
    		// write cookie for persistent session storing
    		$providerKey = 'main'; // defined in security.yml
    		$securityKey = $this->container->getParameter('remember_me_token'); // defined in security.yml
    		
    		//ManagerRe
    		
    		$userProvider = new EntityUserProvider($this->container->get('doctrine'), 'Kachkaev\PhotoAssessmentBundle\Entity\User');
    		
    		$rememberMeService = new TokenBasedRememberMeServices(array($userProvider), $securityKey, $providerKey, array(
    				'path' => '/',
    				'name' => $this->container->getParameter('remember_me_cookie'),
    				'domain' => null,
    				'secure' => false,
    				'httponly' => true,
    				'lifetime' => 315360000, // 10 years
    				'always_remember_me' => true,
    				'remember_me_parameter' => '_remember_me'
    				)
    		);
    		$rememberMeService->loginSuccess($this->container->get('request'), $response, $token);
    	}
	    return $this->render("PhotoAssessmentBundle:Default:survey.html.twig", array(), $response);
    }
    
}
