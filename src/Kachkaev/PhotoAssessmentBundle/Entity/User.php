<?php

namespace Kachkaev\PhotoAssessmentBundle\Entity;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity
 */
class User extends AbstractStandardEntity implements UserInterface {
	protected $standardProperties = array("source", "id", "status", "language", "location");
	protected $standardGetters = array("responses");

	/** @ORM\Column(type="integer")
     *  @ORM\Id
     *  @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;
	
	/** @ORM\OneToMany(targetEntity="PhotoResponse", mappedBy="user", cascade={"all"})
	*/
	protected $responses;
	
	/** @ORM\OneToMany(targetEntity="UserStats", mappedBy="user", cascade={"all"})
	*/
	protected $stats;
	
	/** @ORM\Column(type="integer", nullable=false)
	 */
	protected $status = 0;

	/** @ORM\Column(type="string", nullable=true)
	 */
	protected $language;
	
	/** @ORM\Column(type="string", nullable=true)
	 */
	protected $location;
	
	public function __construct()
    {
        parent::__construct();
        $this->responses = new \Doctrine\Common\Collections\ArrayCollection();
    }
	
    public function getName() {
    	return "Participant#".$this->id;
    }
    
	/**
	 * @inheritDoc
	 */
	public function getRoles() {
		return array('ROLE_PARTICIPANT');
	}
	
	/**
	 * @inheritDoc
	 */
	public function getPassword() {
		return "";
	}
	
	/**
	 * @inheritDoc
	 */
	public function getSalt() {
		return "";
	}
	
	/**
	 * @inheritDoc
	 */
	public function getUsername() {
		return $this->id;
	}
	
	/**
	 * @inheritDoc
	 */
	public function eraseCredentials() {
	}
	
	/**
	 * @inheritDoc
	 */
	public function equals(UserInterface $user) {
		return $user->getUsername() == $this->getUsername();
	}
}
