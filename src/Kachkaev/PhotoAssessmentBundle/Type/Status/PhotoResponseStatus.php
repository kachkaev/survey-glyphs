<?php
namespace Kachkaev\PhotoAssessmentBundle\Type\Status;

class PhotoResponseStatus {
	const UNANSWERED = 0;
	const INCOMPLETE = 1;
	const COMPLETE = 2;
	
	const PHOTO_PROBLEM = 0x10;
}