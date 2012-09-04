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
    	$responses = $em->createQuery($queryStr)->getResult();
    	//$responses = $em->getRepository('PhotoAssessmentBundle:PhotoResponse')->findByUser($user);
    	
    	// Count unanswered replies
    	$countUnanswered = 0;
    	$answeredPhotosIds = array();
    	foreach ($responses as $response) {
    		if ($response->getStatus() == PhotoResponseStatus::UNANSWERED)
    			++$countUnanswered;
    		$answeredPhotosIds []= $response->getPhoto()->getId();
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
    			$response = new PhotoResponse($photoref, $user);
    			$em->persist($response);
    			$responses []= $response;
    		}
    		// Saving them into DB
    		$em->flush();
    		
    		// Rerunning the queury to get all new data
    		$responses = $em->createQuery($queryStr)->getResult();
    	}
    	
    	// Serializing
    	$serializedResponses = array();
    	foreach ($responses as $response) {
    		$serializedResponse = array();
    		
    		foreach ($response->getSerializableProperties() as $property) {
    				$serializedResponse [$property] = $response->get($property);
    		}
    		$photo = $response->getPhoto();
    		$serializedPhoto = array();
    		foreach ($photo->getSerializableProperties() as $property) {
    			$serializedPhoto[$property] = $photo->get($property);
    		}
    		$serializedResponse["photo"] = $serializedPhoto;
    		$serializedResponses [$response->getId()]= $serializedResponse;
    	}
    	return new Response(json_encode($serializedResponses));
    }

    /**
     * @Route("/api/submitReply", name="pat_api_setreply")
     */
    public function submitReplyAction()
    {
    }
}
