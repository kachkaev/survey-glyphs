<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

use Symfony\Component\HttpFoundation\Request;

use Symfony\Component\Security\Core\Exception\AccessDeniedException;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;

use Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus;
use Kachkaev\PhotoAssessmentBundle\Entity\PhotoResponse;
use Kachkaev\PhotoAssessmentBundle\Entity\User;


class SurveyApiController extends Controller
{
    /**
     * @Route("/api/get_queue", name="pat_api_getqueue", defaults={"_format"="json"})
     * @Method({"GET", "POST"})
     * #@Method({"POST"})
	 * @Template()
     */
    public function getQueueAction()
    {
    	$em = $this->get("doctrine.orm.entity_manager");
    	$user = $this->get('security.context')->getToken()->getUser();
    	$container = $this->get('service_container');
    	
    	if (!($user instanceof UserInterface))
    		throw new AuthenticationException();
    	
    	// Getting all responses by the user + info on photos themselves
    	$queryStr = "SELECT pr, p, u FROM KachkaevPhotoAssessmentBundle:PhotoResponse pr LEFT JOIN pr.photo p LEFT JOIN pr.user u WHERE u.id = ".$user->getId()." ORDER BY pr.id";
    	$photoResponses = $em->createQuery($queryStr)->getResult();
    	//$photoResponses = $em->getRepository('KachkaevPhotoAssessmentBundle:PhotoResponse')->findByUser($user);
    	
    	// Queue automatically extends for the first time
    	if (!sizeof($photoResponses)) {
    		$photosToAdd = $container->getParameter('pat.queue_initial_size');
    		$firstPhotoId = $container->getParameter('pat.queue_first_photo_id');
    		if ($firstPhotoId !== null) {
	    		$photoref = $em->getReference('KachkaevPhotoAssessmentBundle:Photo', $firstPhotoId);
	    		$photoResponse = new PhotoResponse($photoref, $user);
	    		$em->persist($photoResponse);
	    		$em->flush();
    			--$photosToAdd;
    		}
    		
    		$this->extendQueueAction($photosToAdd);
    		return $this->getQueueAction();
    	}
    	
    	$apiResponse = [
    		"response" => $this->serializePhotoResponses($photoResponses),
    	];
    	 
    	return new Response(json_encode($apiResponse));
    }

    /**
     * @Route("/api/extend_queue", name="pat_api_extendqueue", defaults={"_format"="json", "count" = 0})
     * @Method({"GET", "POST"})
     * #@Method({"POST"})
	 * @Template()
     */
    public function extendQueueAction($count) {
    	$em = $this->get("doctrine.orm.entity_manager");
    	$user = $this->get('security.context')->getToken()->getUser();
    	$container = $this->get('service_container');
    	
    	if (!($user instanceof UserInterface))
    		throw new AuthenticationException();
    	
    	if (!$count)
    		$count = $this->getRequest()->get('count');
    	if (!$count)
    		$count = $container->getParameter('pat.queue_extension_size');
    	
    	$photoResponses = [];

    	// Getting $count random unanswered photos
    	$idsStmt = $em->getConnection()->query("SELECT id FROM Photo WHERE status = 0 AND id NOT IN (SELECT photoId FROM PhotoResponse WHERE userId = ".$user->getId().") ORDER BY priority DESC, RAND() LIMIT ".$count);
    	$idsStmt->execute();
    	$idsRes = $idsStmt->fetchAll();
    	
    	// Creating empty responses for these photos
    	foreach ($idsRes as $idRes) {
    		$photoref = $em->getReference('KachkaevPhotoAssessmentBundle:Photo', $idRes['id']);
    		$photoResponse = new PhotoResponse($photoref, $user);
    		$em->persist($photoResponse);
    		$photoResponses []= $photoResponse;
    	}
    	
    	// Saving them into DB
    	$em->flush();
    	
    	$apiResponse = [
    		"response" => ["count" => sizeof($idsRes)],
    	];

    	return new Response(json_encode($apiResponse));
    }
    
    /**
     * @Route("/api/submit_response", name="pat_api_submitresponse")
     */
    public function submitResponseAction()
    {
    	$em = $this->get("doctrine.orm.entity_manager");
    	$user = $this->get('security.context')->getToken()->getUser();
    	$container = $this->get('service_container');
    	
    	$data = $this->getRequest()->request->get('response');
    	
    	if (!($user instanceof UserInterface))
    		throw new AuthenticationException();
    	
    	// Finding PhotoResponse in the DB
    	$photoResponse = $em->getRepository('KachkaevPhotoAssessmentBundle:PhotoResponse')->findOneById($data['id']);
    	if (!$photoResponse) {
    		throw new AccessDeniedException("Response does not exist");
    	}
    		
    	if ($photoResponse->getUser()->getId() != $user->getId()) {
    		throw new AccessDeniedException("You are trying to submit response for someone else");
    	}
    	if ($photoResponse->getPhoto()->getId() != $data['photo']['id']) {
    		throw new AccessDeniedException("Wrong photo id submitted in data");
    	}
    	
    	// Reading answers
    	foreach ($data as $k => $v) {
    		if ($v === '')
    			$data[$k] = null;
    		if ($k[0] != 'q')
    			continue;
    		$photoResponse->set($k, $data[$k]);
    	}
    	foreach (['status', 'alteredLat', 'alteredLon', 'status'] as $k) {
    		$photoResponse->set($k, $data[$k]);
    	}
    	
    	$photoResponse->setSubmittedAt(time());
    	if ($data['duration'])
    		$photoResponse->setDuration($photoResponse->getDuration() + $data['duration']);
    	$photoResponse->setSubmissionCount($photoResponse->getSubmissionCount() + 1);
    	
    	// Saving response
    	$em->persist($photoResponse);
    	$em->flush();
    	
    	$apiResponse = [
    		"response" => ["status" => "ok"],
    	];

    	return new Response(json_encode($apiResponse));
    }
    
    /**
     * @Route("/api/set_user_status", name="pat_api_setuserstatus", defaults={"_format"="json", "count" = 0})
     * @Method({"GET", "POST"})
     * #@Method({"POST"})
	 * @Template()
     */
    public function setUserStatusAction($count)
    {
        return $this->changeEntityStatus('User', $this->get('request'));
    }
    
    /**
     * @Route("/api/set_photo_status", name="pat_api_setphotostatus", defaults={"_format"="json", "count" = 0})
     * @Method({"GET", "POST"})
     * #@Method({"POST"})
	 * @Template()
     */
    public function setPhotoStatusAction($count)
    {
        return $this->changeEntityStatus('Photo', $this->get('request'));
    }
    
    /**
     * @Route("/api/set_photo_facesmanual", name="pat_api_setphotofacesmanual", defaults={"_format"="json"})
     * @Method({"GET", "POST"})
     * #@Method({"POST"})
	 * @Template()
     */
    function setPhotoFacesManualAction(Request $request)
    {
        $requestParameters = $request;
        $backdoorSecret = $requestParameters->get('s');
        $value = $requestParameters->get('value');
        
         
        // Checking backdoor security
        if ($backdoorSecret !== $this->container->getParameter('backdoor_secret')) {
            throw new \InvalidArgumentException("Wrong value for backdoor_secret");
        }
         
        // Checking status
        $id     = $requestParameters->get('id');
    
        // Checking id and getting the entity
        $em = $this->get("doctrine.orm.entity_manager");
        $entity = $em->getRepository('KachkaevPhotoAssessmentBundle:Photo')->findOneById($id);
        if (!$entity) {
            throw new \InvalidArgumentException("Wrong value for id");
        }
    
        // Saaving new value to the DB
        $entity->setFacesManual($value);
        $em->persist($entity);
        $em->flush();
         
        $apiResponse = [
            "response" => [
            "status" => "ok",
            ],
        ];
    
        return new Response(json_encode($apiResponse));
    }
    
    protected function changeEntityStatus($entityName, Request $request)
    {
        $requestParameters = $request;
        $backdoorSecret = $requestParameters->get('s');
         
        // Checking backdoor security
        if ($backdoorSecret !== $this->container->getParameter('backdoor_secret')) {
            throw new \InvalidArgumentException("Wrong value for backdoor_secret");
        }
         
        // Checking status
        $id     = $requestParameters->get('id');
        $status = $requestParameters->get('status');
        if (is_string($status))
            $status = (int)$status;
        
        if ($status !== 0 && $status !== 1) {
            throw new \InvalidArgumentException("Wrong value for status");
        }
        
        // Checking id and getting the entity
        $em = $this->get("doctrine.orm.entity_manager");
        $entity = $em->getRepository('KachkaevPhotoAssessmentBundle:'.$entityName)->findOneById($id);
        if (!$entity) {
            throw new \InvalidArgumentException("Wrong value for id");
        }

        // Making sure that the old status is 0 or 1
        $oldStatus = $entity->getStatus();
        if ($oldStatus !== 0 && $oldStatus !== 1) {
            throw new \InvalidArgumentException("Can't change status because old status = ". $oldStatus);
        }
        
        // Changing status and saving this to the DB
        $entity->setStatus($status);
        try {
            $entity->setStatusCheckedAt(time());
        } catch (\Exception $e) {
            
        }
        $em->persist($entity);
        $em->flush();
         
        $apiResponse = [
        "response" => [
                "status" => "ok",
                "changed" => $oldStatus !== $status,
                "old_value" => $oldStatus,
                "new_value" => $status
            ],
        ];
        
        return new Response(json_encode($apiResponse));
    }
    
    function serializePhotoResponses($photoResponses) {
        // Serializing
        $serializedPhotoResponses = [];
        foreach ($photoResponses as $photoResponse) {
            $serializedPhotoResponse = [];
             
            $serializedPhotoResponse["id"] = $photoResponse->getId();
            foreach ($photoResponse->getSerializableProperties() as $property) {
                $serializedPhotoResponse [$property] = $photoResponse->get($property);
            }
            $photo = $photoResponse->getPhoto();
            $serializedPhoto = [];
            foreach ($photo->getSerializableProperties() as $property) {
                $p = $photo->get($property);
                if ($p !== null)
                    $serializedPhoto[$property] = $photo->get($property);
            }
            $serializedPhotoResponse["photo"] = $serializedPhoto;
            $serializedPhotoResponses []= $serializedPhotoResponse;
        }
        return $serializedPhotoResponses;
    }
}
