<?php

namespace Kachkaev\PhotoAssessmentBundle\Controller;

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
    	$queryStr = "Select pr, p, u FROM PhotoAssessmentBundle:PhotoResponse pr LEFT JOIN pr.photo p LEFT JOIN pr.user u WHERE u.id = ".$user->getId()." ORDER BY pr.id";
    	$photoResponses = $em->createQuery($queryStr)->getResult();
    	//$photoResponses = $em->getRepository('PhotoAssessmentBundle:PhotoResponse')->findByUser($user);
    	
    	// Queue automatically extends for the first time
    	if (!sizeof($photoResponses)) {
    		$this->extendQueueAction($container->getParameter('pat.queue_initial_size'));
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
    	$idsStmt = $em->getConnection()->query("SELECT id FROM Photo WHERE status = 0 AND id NOT IN (SELECT photoId FROM Photoresponse WHERE userId = ".$user->getId().") ORDER BY RAND() LIMIT ".$count);
    	$idsStmt->execute();
    	$idsRes = $idsStmt->fetchAll();
    	
    	// Creating empty responses for these photos
    	foreach ($idsRes as $idRes) {
    		$photoref = $em->getReference('PhotoAssessmentBundle:Photo', $idRes['id']);
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
    public function submitReplyAction()
    {
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
