<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

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
    	$queryStr = "Select pr, p, u FROM KachkaevPhotoAssessmentBundle:PhotoResponse pr LEFT JOIN pr.photo p LEFT JOIN pr.user u WHERE u.id = ".$user->getId()." ORDER BY pr.id";
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
    	$idsStmt = $em->getConnection()->query("SELECT id FROM Photo WHERE status = 0 AND id NOT IN (SELECT photoId FROM PhotoResponse WHERE userId = ".$user->getId().") ORDER BY RAND() LIMIT ".$count);
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
