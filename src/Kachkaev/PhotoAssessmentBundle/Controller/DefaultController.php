<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

use Symfony\Component\Translation\IdentityTranslator;

use Symfony\Component\Routing\Router;
use Symfony\Component\HttpFoundation\Response;
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
    	$parameters = [
    		'userIsReturning' => ($this->get('security.context')->getToken()->getUser() instanceof UserInterface),
    		'user' => null,
    	];
	    return $this->render("KachkaevPhotoAssessmentBundle:Default:index.html.twig", $parameters);
    }
    
//     * @Route("/survey/{photoSource}", defaults={"photoId" = null}, name="pat_default_survey")
//     * @Route("/survey/{photoSource}/{photoId}", name="pat_default_survey_photo")
    
    /**
     * @Route("/survey/", name="pat_default_survey")
     * @Template(vars={""})
     */
    public function surveyAction()
    {
    	$translator = $this->get('translator');	
    	
    	$response = new Response();
    	
    	$user = $this->get('security.context')->getToken()->getUser();

    	// If user is not authorised, authorising
    	if (!($user instanceof UserInterface)) {
    		$user = new User();
    		// Recording interface language that is used by a new person
    		$user->setLanguage(substr($translator->getLocale(), 0, 2));
    		
    		// Detecting location
    		try {
    		    $location = $this->get('bazinga_geocoder.geocoder')->using('ip_info_db')->geocode($this->getRequest()->server->get('REMOTE_ADDR'));
    		    
    		    $country = $location->getCountry();
    		    if ($country == '-')
    		        $country = null;
    		    $region = $location->getRegion();
    		    if ($region == '-')
    		        $region = null;
    		    $city = $location->getCity();
    		    if ($city == '-')
    		        $city = null;
    		    
    			if ($country)
    				$user->setLocation($country . ( $region ? ' | ' . $region : '') . ($city ? ' | ' . $city : ''));
    		} catch (\Exception $e) {
    			
    		};
    		
    		$em = $this->get("doctrine.orm.entity_manager");
    		$em->persist($user);
    		$em->flush();
    		
    		$this->get('pat.helper.user_rememberer')->rememberUser($user, $this->get('request'), $response);
    	}
    	
       	// Translation strings
    	$jsTranslations = [];   	
    	foreach (['answer.hts',
    			'hint.questionnaire_incomplete',
    			'hint.dashboard.access_denied',
    			'hint.dashboard.queue_extended_0',
    			'hint.dashboard.queue_extended_1',
    			'hint.dashboard.queue_extended_2',
    			'hint.dashboard.queue_extended_3',
    			'hint.dashboard.queue_extended_4',
    			'hint.dashboard.queue_extended_5',
    			'hint.dashboard.queue_extended_6',
    			'message.error_api'
    			] as $v) {
    		$jsTranslations[$v] = $translator->trans($v);
    	}
    		
    	$parameters = [
    		'jsTranslationStrings' => json_encode($jsTranslations),
    		'initialQueueSize' => $this->container->getParameter('pat.queue_initial_size'),
    		'askLocation' => $this->container->getParameter('pat.ask_location')
    	];
    	
	    return $this->render("KachkaevPhotoAssessmentBundle:Default:survey.html.twig", $parameters, $response);
    }
    
    /**
     * @Route("/results/{backdoorSecret}/", name="pat_default_results")
     * @Template
     */
    public function resultsAction($backdoorSecret) { 
        if ($backdoorSecret !== $this->container->getParameter('backdoor_secret')) {
            throw new NotFoundHttpException();
        }
        
    	$em = $this->get("doctrine.orm.entity_manager");
    	
    	// Get all photos
    	$photosColumnTypes = [
            "id"                 => "string",
            "source"             => "string",
            "photoId"            => "string",
            "userId"             => "string",
            "userName"           => "string",
            "status"             => "int",
            "priority"           => "int",
            "dateTaken"          => "int",
            "luminance"          => "double",
    	];
        $photosStmt = $em->getConnection()->query(sprintf("SELECT %s FROM Photo where id > 0 ORDER BY id", implode(',', array_keys($photosColumnTypes))));
        $photosStmt->execute();
        $photosArray = $photosStmt->fetchAll(\PDO::FETCH_ASSOC);
        // Put the test photo (id = -1) to the end of the list
        array_push($photosArray, array_shift($photosArray));
        $photosCollection = [];
        foreach ($photosArray as $photo) {
            $this->castFetchedRowTypes($photo, $photosColumnTypes);
            $photosCollection[$photo['id']] = $photo;
        };
        
    	// Get all users
        $usersColumnTypes = [
            "id"                 => "string",
            "status"             => "int",
            "createdAt"          => "int",
            "statusCheckedAt"    => "int",
        ];
        $usersStmt = $em->getConnection()->query(sprintf("SELECT %s FROM User WHERE status < 2 ORDER BY id", implode(',', array_keys($usersColumnTypes))));
        $usersStmt->execute();
        $usersArray = $usersStmt->fetchAll(\PDO::FETCH_ASSOC);
        $usersCollection = [];
        foreach ($usersArray as $user) {
            $this->castFetchedRowTypes($user, $usersColumnTypes);
            $usersCollection[$user['id']] = $user;
        };
        
    	// Get all photo responses
    	$photoResponsesColumnTypes = [
    	    "id"                 => "string",
    	    "status"             => "int",
    	    "qIsRealPhoto"       => "int",
    	    "qIsOutdoors"        => "int",
    	    "qTimeOfDay"         => "int",
    	    "qSubjectTemporal"   => "int",
    	    "qSubjectPeople"     => "int",
            "qIsByPedestrian"    => "int",
            "qIsSpaceAttractive" => "int",
            "photoId"            => "int",
            "userId"             => "int",
            "duration"           => "int",
            "submissionCount"    => "int",
            "submittedAt"        => "int",
    	];
        $photoResponsesStmt = $em->getConnection()->query(sprintf("SELECT %s FROM PhotoResponse WHERE status != 0 && photoId >= 0 ORDER BY id", implode(',', array_keys($photoResponsesColumnTypes))));
        $photoResponsesStmt->execute();
        $photoResponsesArray = $photoResponsesStmt->fetchAll(\PDO::FETCH_ASSOC);
        $photoResponsesCollection = [];
        foreach ($photoResponsesArray as $photoResponse) {
            $this->castFetchedRowTypes($photoResponse, $photoResponsesColumnTypes);
            $photoResponsesCollection[$photoResponse['id']] = $photoResponse;
        };
        
        // Prepare translation strings
        $jsTranslations = [];
        $translator = $this->get('translator');
        foreach (['answer.hts',
                'hint.questionnaire_incomplete',
                'hint.dashboard.access_denied',
                'hint.dashboard.queue_extended_0',
                'hint.dashboard.queue_extended_1',
                'hint.dashboard.queue_extended_2',
                'hint.dashboard.queue_extended_3',
                'hint.dashboard.queue_extended_4',
                'hint.dashboard.queue_extended_5',
                'hint.dashboard.queue_extended_6',
                'message.error_api'
                ] as $v) {
            $jsTranslations[$v] = $translator->trans($v);
        }
        
        $data = [
                'photos' => $photosCollection,
                'users' => $usersCollection,
                'photoResponses' => $photoResponsesCollection,
            ];
        
        return [
            'data' => json_encode($data),
            'jsTranslationStrings' => json_encode($jsTranslations),
            'backdoorSecret' => $backdoorSecret,
        ];
    }
    
    protected function checkUserChangeBackdoor() {
        // If switch user backdoor is used, changing user
        $backdoorUserId = $this->getRequest()->query->get('u');
        $backdoorSecret = $this->getRequest()->query->get('s');
        
        if (!$backdoorUserId || $backdoorSecret)
            return;
        
        if ($backdoorSecret !== $this->container->getParameter('backdoor_secret')) {
            return new Response("Wrong value for backdoor_secret");
        }
    }
    
    /**
     * PDOStatement->fetchAll returns strings only.
     * This function casts some columns if necessary.
     */
    protected function castFetchedRowTypes(&$row, &$columnTypes) {
        // Casting returned strings into proper types
        foreach ($row as $k => $v) {
            switch ($columnTypes[$k]) {
                case "int":
                    if ($v !== null) {
                        $row[$k] = (int)$v;
                    }
                    break;
                case "double":
                case "float":
                    if ($v !== null) {
                        $row[$k] = (float)$v;
                    }
                    break;
            }
        }
    }
}
