<?php
namespace Kachkaev\PhotoAssessmentBundle\Type\Status;

class PhotoResponseStatus {
	const UNANSWERED = 0;
	const INCOMPLETE = 1;
	const COMPLETE = 2;
	
	const PHOTO_PROBLEM = 0x10;
	
	static protected $constantsTable;
	
	public static function valueToString($value) {
	    static::generateConstantsTableIfNeeded();
	    return $constantsTable[$value];
	}
	
	public static function getListOfValues() {
	    static::generateConstantsTableIfNeeded();
	    return $constantsTable;
	}
	
	protected function generateConstantsTableIfNeeded() {
	    if (!static::$constantsTable) {
	        $refl = new ReflectionClass('Kachkaev\PhotoAssessmentBundle\Type\Status\PhotoResponseStatus');
	        static::$constantsTable = array_flip($refl->getConstants());
	    }
	}
}