<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

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
    	// If user is not authorised, authorising
    	$user = $this->get('security.context')->getToken()->getUser();
    	if (!($user instanceof UserInterface)) {
    		$user = new User();
    		$em = $this->get("doctrine.orm.entity_manager");
    		$em->persist($user);
    		$em->flush();
    		
    		$token = new UsernamePasswordToken($user, null, 'main', $user->getRoles());
    		$this->get('security.context')->setToken($token);
    		
    	}
    	
    	
    }
}
