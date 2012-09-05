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
     * @Route("/api/get_queue", name="pat_api_getqueue",  defaults={"_format"="json"})
     * #@Method({"GET", "POST"})
     * @Method({"POST"})
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
    	
    	// Count unanswered replies
    	$countUnanswered = 0;
    	$answeredPhotosIds = [];
    	foreach ($photoResponses as $photoResponse) {
    		if ($photoResponse->getStatus() == PhotoResponseStatus::UNANSWERED)
    			++$countUnanswered;
    		$answeredPhotosIds []= $photoResponse->getPhoto()->getId();
    	};
    	
    	// Extend queue if less than  unanswered photos left
    	if ($countUnanswered <= $container->getParameter('pat.queue_unanswered_count_for_extension')) {
    		
    		// Getting 20 random photos
    		$idsStmt = $em->getConnection()->query("SELECT id FROM Photo WHERE status = 0".(sizeof($answeredPhotosIds) ? " and id not in (".implode(",", $answeredPhotosIds).")":""). "  ORDER BY RAND() LIMIT ".$container->getParameter('pat.queue_extension_size'));
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
    		
    		// Rerunning the queury to get all new data
    		$photoResponses = $em->createQuery($queryStr)->getResult();
    	}
    	
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
    			$serializedPhoto[$property] = $photo->get($property);
    		}
    		$serializedPhotoResponse["photo"] = $serializedPhoto;
    		$serializedPhotoResponses []= $serializedPhotoResponse;
    	}
    	$apiResponse = [
    		"response" => $serializedPhotoResponses,
    	];
    	return new Response(json_encode($apiResponse));
    }

    /**
     * @Route("/api/submit_response", name="pat_api_submitresponse")
     */
    public function submitReplyAction()
    {
    }
}
