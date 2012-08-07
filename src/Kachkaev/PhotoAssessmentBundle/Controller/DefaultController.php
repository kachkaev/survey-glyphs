<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

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
    
    /**
     * @Route("/survey/{photoSource}", defaults={"photoId" = null}, name="pat_default_survey")
     * @Route("/survey/{photoSource}/{photoId}", name="pat_default_survey_photo")
     * @Template(vars={""})
     */
    public function surveyAction($photoSource, $photoId)
    {
    	// Checking Photo source
    	 
    	// If user is unauthorised, authorising
    }
}
