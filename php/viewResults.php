<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
    
//$serviceAccount = ServiceAccount::fromJsonFile('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
if(file_exists('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json'))
    $firebase = (new Factory)->withServiceAccount('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
else
    $firebase = (new Factory)->withServiceAccount(getenv("firebase_secret"));

$storage = $firebase->createStorage();
$storageClient = $storage->getStorageClient();
$defaultBucket = $storage->getBucket();

/*$defaultBucket->upload(file_get_contents("../results/".$_GET['experiment-id']."/title.txt"),
[
    'name' => "uploaded_title.txt"
]);*/

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


    if(isset($_GET['experiment-id'])){
        if(strpos($_GET['experiment-id'],".") !== false){
            exit();
        }
        $folder="results/".$_GET['experiment-id'];

        if(!is_dir("../".$folder))
            mkdir("../".$folder);

        try{
            $defaultBucket->object($folder."/password.txt")->downloadToFile("../".$folder."/password.txt");
        }catch(Exception $e) {
        }finally{
            $password=@file_get_contents("../".$folder."/password.txt");
            if($password==""){
                $password=false;
            }
        }
        //echo($_POST['password']."-".password_hash($_POST['password'], PASSWORD_BCRYPT));


        if($password){
            if(isset($_POST['old-password']) && password_verify($_POST['old-password'],$password)){
                //file_put_contents($folder."/password.txt",password_hash($_POST['password'], PASSWORD_BCRYPT));

            }elseif(!isset($_POST['password']) || isset($_POST['password'])==""){
                echo('<h1>Introduce your password</h1><form class="form-box" method="POST">
                    <input id="password" type="password" name="password"/>
                    <input type="submit" class="download-results" id="create-password" value="submit">
                </form>');
                exit();
            }elseif(!password_verify($_POST['password'],$password)){
                exit("password error");
            }
        }elseif(isset($_POST['password'])){
            $hash=password_hash($_POST['password'], PASSWORD_BCRYPT);
            file_put_contents("../".$folder."/password.txt",$hash);
            
            $defaultBucket->upload($hash,
            [
                'name' => $folder."/password.txt"
            ]);
            
            $password=true;

        }

        try{
            $defaultBucket->object($folder."/title.txt")->downloadToFile("../".$folder."/title.txt");
        }catch(Exception $e) {
        }

        $title=@file_get_contents("../".$folder."/title.txt");
        if($title==""){
            $title="Experiment";
        }
        

        /*$files = array();
        $filemtimes=array();
        foreach (glob($folder."/*.pso") as $file) {
            $files[] = $file;
        }*/

        $objects = $defaultBucket->objects([
            'prefix' => $folder,
        ]);
        $files=array();
        foreach ($objects as $object) {
            //echo $object->name()." | " . PHP_EOL;
            $object->downloadToFile("../".$object->name());
            array_push($files,"../".$object->name());
        }

        $files = glob("../".$folder."/*.pso");
            array_multisort(
                array_map( 'filemtime', $files ),
                SORT_NUMERIC,
                SORT_ASC,
                $files
            );

        if(isset($_GET['zip'])){
            $filename="../".$folder.'/'.$_GET['experiment-id'].'.zip';
            array_map('unlink', glob("../".$folder."/*.zip"));
            //echo('cd '.$folder.'; zip -q '.$_GET['experiment-id'].'.zip *.pso');

            if(isset($_POST['JSON'])){
                exec('cd "../'.$folder.'"; zip -q '.$_GET['experiment-id'].'.zip *.pso');
                //echo('tar zcf '.$filename.' '.$folder.'/*.pso');
            
                if (file_exists($filename)) {
                    header('Content-Type: application/zip');
                    header('Content-Disposition: attachment; filename="'.basename($filename).'"');
                    header('Content-Length: ' . filesize($filename));
                
                    flush();
                    readfile($filename);
                    // delete file
                    //unlink($filename);
            
                }
            }elseif(isset($_POST['CSV'])){
                array_map('unlink', glob("../".$folder."/*.csv"));
                foreach($files as $f){
                    $participant=json_decode(file_get_contents($f));
                    //var_dump($participant->data);
                    $vars=$participant->data;
                    if(count($vars)){
                        $keys=array_keys((array)$vars[0]);
                        $keysCSV="";
                        foreach($keys as $key){
                            if(!is_object($vars[0]->$key)){
                                $keysCSV=$keysCSV.$key.",";
                            }
                        }
                        $keysCSV=substr($keysCSV, 0, -1);
                        $valuesCSV="";
                        foreach($vars as $trial){
                            foreach($keys as $key){
                                if(!is_object($trial->$key)){
                                    if(is_array($trial->$key))
                                        $k=recursive_implode($trial->$key,";");
                                    else
                                        $k=$trial->$key;
                                    $valuesCSV=$valuesCSV.$k.",";
                                }
                            }
                            $valuesCSV=substr($valuesCSV, 0, -1)."\n";
                        }
                        //echo $keysCSV."\n".$valuesCSV;
                        file_put_contents("../".$folder."/".$participant->name.".csv",$keysCSV."\n".$valuesCSV);
                    }
                    
                }

                exec('cd "../'.$folder.'"; zip -q '.$_GET['experiment-id'].'.zip *.csv');
                //echo('tar zcf '.$filename.' '.$folder.'/*.pso');
            
                if (file_exists($filename)) {
                    header('Content-Type: application/zip');
                    header('Content-Disposition: attachment; filename="'.basename($filename).'"');
                    header('Content-Length: ' . filesize($filename));
                
                    flush();
                    readfile($filename);
                }
            }
             exit();
        }

        

?>
<head>
<title>PSY&#9898;PHY - <?php echo($title); ?></title>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mobile-detect@1.4.4/mobile-detect.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js"></script>
<script src="/js/jquery.key.js"></script>
<script src="/js/functions.js"></script>
<script src="/js/main.js"></script>
<script src="/js/google_drive.js"></script>
<link rel="stylesheet" type="text/css" href="/css/style.css">
<link rel="icon" href="favicon.ico" type="image/x-icon" />
<link href="/css/fontawesome.css" rel="stylesheet"> 
</head>
<body>
    <div id="trial-container"></div>
    <div class="background">
        <div id="form-data">
            <a href='../../'><img src="../../images/psyphy.png" class="logo" width="300"></a>
            <div class="credits">Developed by <a href="mailto:lago@psych.ucsb.edu">Miguel Lago</a><br>
                for <a href="https://viu.psych.ucsb.edu" target="_blank">VIU lab at UCSB</a>
                <br>
                version <a id="version" href="https://gitlab.com/malago/psyphy" target="_blank"></a>
            </div> 
<?php


        

        ?>
        <p>Here, you will find a list of participants on your experiment.</p>
        <p>Download all data by clicking the button at the end, old participant data will be erased periodically so be sure to download your data.</p>
        <p>You will need to <strong>create a password</strong> to download the data.</p>
        <form class="form-box" method="POST" style="width:33%">
            <i class="fas fa-key" style="position: absolute; top: 20px; left: 20px;"></i> 
            <?php if($password) echo '<input id="old-password" type="password" name="old-password" placeholder="old password" /><br>'; ?>            
            <input id="password" type="password" name="password" placeholder="new password"/>
            <input type="submit" class='download-results' id="create-password" value="set password">
        </form>
        <hr>
        <?php

echo("<h1>Participants in experiment <strong>".$title."</strong></h1>");

        echo("<ul class='results'>");
        $i=1;
        foreach($files as $f){
            $participant=json_decode(file_get_contents($f));
            //print_r($participant);
            //$f=end(explode("/",$f));
            if(!property_exists($participant,"stopTime"))
                $stopTime="unfinished";
            else
                $stopTime=calculate_time_span(date("U")-intval($participant->stopTime)/1000);
            echo("<li><div class='name'><i class='fas fa-user'></i><br> #".$i."</div> <div class='date'>".$stopTime."</div></li>");
            $i++;
        }
        echo("</ul><br><br>");
        if(!$password){
            echo "<h2 class='error'><i class='fas fa-lock'></i> Set a password to download your data <i class='fas fa-lock'></i></h2>";
        }elseif(count($files)>0){ ?>
            <form class="form-box" method="POST" action=<?php echo "../".$_GET['experiment-id'].".zip" ?> style="width:33%">   
                <i class="fas fa-download" style="position: absolute; top: 20px; left: 20px"></i> 
                <input id="password" type="password" name="password" placeholder="repeat password"/>
                Download results: <input type="submit" class='download-results json' value="JSON" name="JSON" >
                <input type="submit" class='download-results csv' value="CSV" name="CSV">
            </form>
        <?php } ?>
        </div>
    </div>
</body>

<?php } ?>