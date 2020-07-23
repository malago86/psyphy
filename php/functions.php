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