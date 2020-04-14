

function load_stimuli(name){
    var stimuli = {img:[],info:null};
    
    var exists=true;
    var i=1;
    while(exists){
        if(imageExists("stimuli/"+name+"/noise_"+i+".jpg")){
            stimuli.img[i]=new Image();
            stimuli.img[i].src = "stimuli/"+name+"/noise_"+i+".jpg";   
            i+=1;
        }else{
            exists=false;
        }
        if(i==100){
            exists=false;
        }
    }

    stimuli.slices=i-1;
    stimuli.info={
        signalSize:0,
        locations:[-1,-1,-1],
        contrast:0,
    };
    $.getJSON("stimuli/"+name+"/locations.json",function( data ) {
        stimuli.info=data;
    }).fail(function() {
        
    });

    return stimuli;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function imageExists(image_url){
 
    var http = new XMLHttpRequest();
 
    http.open('HEAD', image_url, false);
    http.send();
 
    return http.status != 404;
 
}

function show_confidence_ratings(ratings){
    $("#confidence-scale").text("");
    for(i=0;i<ratings;i++){
        if(i<ratings/2) divclass="absent";
        else divclass="present";
        //console.log('rating '+divclass);
        jQuery('<div/>', {
            "class": 'rating '+divclass,
            "num": i+1,
            title: i+1,
            text: i+1
        }).appendTo('#confidence-scale');
    }

}
  
function finishExperiment(arr){
    results={results:arr};
    
    $.ajax({
        type: "POST",
        url: "https://people.psych.ucsb.edu/lago/miguel/3d-detection/upload.php",
        data: results,
        dataType: "json",
        success: function(data){
            //console.log("SUCCESS");
            console.log(data["responseText"]);
        },
        error: function(data){
            //console.log("ERROR");
            console.log(data["responseText"]);
        }
      });
}

function getDisplayParameters( display){
    var img = document.querySelector("#stimulus img");

    
    //$('#help #monitor-size').html("Monitor: "+parseInt(display.monitorWidth)+" by "+parseInt(display.monitorHeight) +" cm");
    $('#help #resolution').html("Resolution: "+screen.width+" by "+screen.height);
    $('#help #image-size').html("Stimulus: "+img.width+" by "+img.height);
    $('#help #image-real-size').html("Stimulus original: "+img.naturalWidth+" by "+img.naturalHeight);

    /*
    ratio=img.naturalWidth/img.width;
    //console.log(ratio);
    pixelsPerCM=screen.width/display.monitorWidth;
    distance=(1/display.degreesPerPixel)/Math.tan(1 * Math.PI/180)/pixelsPerCM/ratio;

    $('#help #distance-required').html("Distance required: "+parseInt(distance)+" cm");
    */

    distance=(display.pixelsPerDegree*display.pixelsPerCM/Math.tan(1 * Math.PI/180));

    $('#help #distance-required').html("Distance: "+parseInt(distance)+" cm");
    display.stimulusWidth=img.width;
    display.stimulusHeight=img.height;
    display.distance=distance;
    
    return display;
}

function calibrationMove(elem) {
    var pos = 100;
    var direction=-20;
    var id = setInterval(frame, 60, elem);
    
    function frame(elem) {
        var maxDisplacement=$(elem).parent().width()-20;
        if (pos >= maxDisplacement || pos <= 100) {
            direction*=-1;
        }
        pos+=direction;
        //console.log(pos);
        $(elem).css("right",pos+"px");
    }

    return id;
}

function mean(numbers) {
    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}