<?php
//HELPER FUNCTIONS

function sanitize_id($string){
    return substr(preg_replace('/[^[:alnum:]-]/', '', $string),0,100);
}

function sanitize_participant($participant){
    $participant = strip_tags( $participant );
    // Preserve escaped octets.
    $participant = preg_replace( '|%([a-fA-F0-9][a-fA-F0-9])|', '---$1---', $participant );
    // Remove percent signs that are not part of an octet.
    $participant = str_replace( '%', '', $participant );
    // Restore octets.
    $participant = preg_replace( '|---([a-fA-F0-9][a-fA-F0-9])---|', '%$1', $participant );    

    // Kill entities.
    $participant = preg_replace( '/&.+?;/', '', $participant );
    $participant = str_replace( '.', '-', $participant );

    $participant = preg_replace( '/[^%a-zA-Z0-9 _-]/', '', $participant );
    //$participant = preg_replace( '/\s+/', '-', $participant );
    $participant = preg_replace( '|-+|', '-', $participant );
    $participant = trim( $participant, '-' );

    return $participant;
}

function getFileCloud($filename,$defaultBucket){
    $object=$defaultBucket->object($filename);
    if($object->exists()){
        $object->downloadToFile("../".$filename);
        return file_get_contents("../".$filename);
    }
    return false;
}

function putFileCloud($filename,$data,$defaultBucket){
    
    file_put_contents("../".$filename, $data);

    $object = $defaultBucket->object($filename);
    $defaultBucket->upload($data,
    [
        'name' => $filename
    ]);
}


function recursive_implode(array $array, $glue = ',', $include_keys = false, $trim_all = true){
	$glued_string = '';

	// Recursively iterates array and adds key/value to glued string
	array_walk_recursive($array, function($value, $key) use ($glue, $include_keys, &$glued_string)
	{
		$include_keys and $glued_string .= $key.$glue;
		$glued_string .= $value.$glue;
	});

	// Removes last $glue from string
	strlen($glue) > 0 and $glued_string = substr($glued_string, 0, -strlen($glue));

	// Trim ALL whitespace
	$trim_all and $glued_string = preg_replace("/(\s)/ixsm", '', $glued_string);

	return (string) $glued_string;
}


function calculate_time_span($seconds)
{  
	$year = floor($seconds /31556926);
	$months = floor($seconds /2629743);
	$week=floor($seconds /604800);
	$day = floor($seconds /86400); 
	$hours = floor($seconds / 3600);
	$mins = floor(($seconds - ($hours*3600)) / 60); 
	$secs = floor($seconds % 60);
	 if($seconds < 60) $time = $secs." seconds";
	 else if($seconds < 3600 ) $time =($mins==1)?$mins." minute":$mins." minutes";
	 else if($seconds < 86400) $time = ($hours==1)?$hours." hour":$hours." hours";
	 else if($seconds < 604800) $time = ($day==1)?$day." day":$day." days";
	 else if($seconds < 2629743) $time = ($week==1)?$week." week":$week." weeks";
	 else if($seconds < 31556926) $time =($months==1)? $months." month":$months." months";
	 else $time = ($year==1)? $year." year":$year." years";
	return $time." ago"; 
} 

function recursiveDelete($str) {
    if (is_file($str)) {
        return @unlink($str);
    }
    elseif (is_dir($str)) {
        $scan = glob(rtrim($str,'/').'/*');
        foreach($scan as $index=>$path) {
            recursiveDelete($path);
        }
        return @rmdir($str);
    }
}