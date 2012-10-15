<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class Photo extends AbstractStandardEntity {
	protected $standardProperties = ["status"];
	protected $standardGetters = ["source", "photoId", "userId", "userName", "respnoses"];

	/** @ORM\Column(type="integer")
     *  @ORM\Id
     *  @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/** @ORM\OneToMany(targetEntity="PhotoResponse", mappedBy="photo", cascade={"all"})
	*/
	protected $responses;
	
	/** @ORM\Column(type="string", nullable=false)
	 */
	protected $source;

	/** @ORM\Column(type="string", nullable=false)
	 */
	protected $photoId;

	/** @ORM\Column(type="string", nullable=false)
	 */
	protected $userId;
	
	/** @ORM\Column(type="string")
	 */
	protected $userName;
	
	/** @ORM\Column(type="decimal")
	 */
	protected $lon;
	
	/** @ORM\Column(type="decimal")
	 */
	protected $lat;

	/** @ORM\Column(type="integer", nullable=false)
	 */
	protected $status = 0;

	/** @ORM\Column(type="integer", nullable=false)
	 */
	protected $completeResponsesCount = 0;
	
	public function getId() {    
        return $this->id;        
    }     
    
    public function __construct()
	{
		parent::__construct();
		$this->responses = new \Doctrine\Common\Collections\ArrayCollection();
	}

	public function getSerializableProperties() {
		return array("id", "source", "photoId", "userId", "userName");
	}
}
