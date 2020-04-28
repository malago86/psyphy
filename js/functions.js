
var loaded=0;
function moveLoadingBar(loaded, max){
    loaded++;
    if(loaded==max){
        $("#loading-bar").hide();
        $("#trial-container").show();
        $("#loading-bar-progress").css("width","0%");
        running=true;
        stimulusOn=Date.now();
        if(arr.config.options.timeout>0){
            setTimeout(
                showConfidenceRatings,
                arr.config.options.timeout,
                arr.config.options.ratings,
                arr.data.length+1
                );
        }
    }
    else
        $("#loading-bar-progress").css("width",(100*(loaded+1)/max)+"%");
}
function load_stimuli_drive(list,info){
    $("#loading-bar").show();
    $("#trial-container").hide();
    loaded=0;
    running=false;
    var stimuli = {img:[],info:null};
    for(i=0;i<list.length;i++){
        if(list[i].name.includes("mp4")){
            stimuli.img[i]=document.createElement("video");
            stimuli.img[i].autoplay = true;
            //stimuli.img[i].setAttribute("controls","controls");
            stimuli.img[i].onloadeddata = function() {
                moveLoadingBar(loaded,list.length);
            };
        }else{
            stimuli.img[i]=new Image();
            stimuli.img[i].stimId=i;
            stimuli.img[i].stimMax=list.length;
        }
        stimuli.img[i].id="stimulus-img";
        stimuli.img[i].setAttribute("numImg",i+1);
        
        stimuli.img[i].onload = function() { 
            loaded++;
            if(loaded==list.length){
                $("#loading-bar").hide();
                $("#trial-container").show();
                $("#loading-bar-progress").css("width","0%")
                $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/list.length+"%");
                running=true;
                stimulusOn=Date.now();
            }
            else
                $("#loading-bar-progress").css("width",(100*(loaded+1)/list.length)+"%");
        }

        stimuli.img[i].src = "php/getStimuli.php?file-id="+list[i].id+"&name="+list[i].name;
    }

    stimuli.slices=list.length;
    stimuli.info={};
    if(info){
        $.getJSON("php/getStimuli.php?file-id="+info.id,function( data ) {
            stimuli.info=data;
            if(stimuli.info.text && preparation==false){
                $("#trial-container .text").css( "display", "table" );
                $("#trial-container .text div").html(stimuli.info.text);
                preparation=true;
            }
        }).fail(function() {
            
        });
    }

    if(list.length>1){
        $("#stimulus-scroll-bar").show();
        $("#stimulus-slice").show();
    }else{
        $("#stimulus-scroll-bar").hide();
        $("#stimulus-slice").hide();
    }

    return stimuli;
}

function load_stimuli(name){
    var stimuli = {img:[],info:null};
    running=false;
    loaded=0;
    var exists=true;
    var i=0;
    while(exists){
        if(imageExists(name+"/noise_"+(i+1)+".jpg")){
            stimuli.img[i]=new Image();
            stimuli.img[i].onload = function() { 
                loaded++;
                if(loaded==50){
                    $("#loading-bar").hide();
                    $("#trial-container").show();
                    $("#loading-bar-progress").css("width","0%");
                    $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/loaded+"%");
                    $("#trial-container .text").css( "display", "table" );
                    $("#trial-container .text div").html(stimuli.info.text);
                    preparation=true;
                    stimulusOn=Date.now();
                }
                else
                    $("#loading-bar-progress").css("width",(100*(loaded+1)/50)+"%")
            }
            stimuli.img[i].src = name+"/noise_"+(i+1)+".jpg";   
            stimuli.img[i].id="stimulus-img";
            stimuli.img[i].setAttribute("numImg",i+1);
            i+=1;
        }else{
            exists=false;
        }
        if(i==100){
            exists=false;
        }
    }

    stimuli.slices=stimuli.img.length;
    stimuli.info={
        signalSize:0,
        locations:[-1,-1,-1],
        contrast:0,
    };
    $.getJSON(name+"/locations.json",function( data ) {
        stimuli.info=data;
    }).fail(function() {
        
    });
    running=true;

    return stimuli;
}

function load_stimuli2(name){
    var stimuli = {img:[],info:null};
    var canvas = {img:[],info:null};
    
    listImages=[];
    ctx=[];

    var exists=true;
    var i=1;
    while(exists){
        if(imageExists("stimuli/"+name+"/noise_"+i+".jpg")){
            listImages.push("stimuli/"+name+"/noise_"+i+".jpg");
        }else{
            exists=false;
        }
        if(i==100){
            exists=false;
        }
        i+=1;
    }

    console.log(canvas.img[1]);

    listImages=listImages.map(function(i) {
        var img = document.createElement("img");
        img.src = i;
        return img;
    });

    Promise.all(listImages.map(function(image) {
        return new Promise(function(resolve, reject) {
            image.onload = resolve;
        });
    })).then(function() {
        var canvas_img=[];
        for (var i = 0; i < listImages.length; i++) {
            var img = listImages[i];

            canvas_img[i] = document.createElement("canvas");
            canvas_img[i].id="stimuli"+i;
            canvas_img[i].width=1024;
            canvas_img[i].height=820;
            
            canvas_img[i].getContext("2d").drawImage(img, 0, 0);
            canvas_img[i]=canvas_img[i].toDataURL();
        }
        //console.log(canvas_img);
        canvas.img=canvas_img;
    });

    canvas.slices=i-1;
    canvas.info={
        signalSize:0,
        locations:[-1,-1,-1],
        contrast:0,
    };
    $.getJSON("stimuli/"+name+"/locations.json",function( data ) {
        canvas.info=data;
    }).fail(function() {
        
    });

    return canvas;

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

function showConfidenceRatings(ratings, trialNumber){
    stimulusOff=Date.now();
    $("#trial-container").hide();
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
    $("#response-container").css("display","table");
    $("#response-text").text("Trial: "+trialNumber);
    $("#help").hide();
}
  
function finishExperiment(arr){
    results={results:arr};
    
    $.ajax({
        type: "POST",
        url: "upload.php",
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
    var img = document.querySelector("#stimulus #stimulus-img");

    
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

    $('#help #distance-required').html("Distance: "+parseInt(distance)+" cm ("+parseInt(distance/2.54)+" in)");
    display.stimulusWidth=img.width;
    display.stimulusHeight=img.height;
    display.distance=distance;
    
    return display;
}

function calibrationMove(elem) {
    var pos = 100;
    var direction=20;
    var id = setInterval(frame, 200, elem);
    
    function frame(elem) {
        var maxDisplacement=$(elem).parent().width()-20;
        if (pos >= maxDisplacement) {
            //direction*=-1;
            pos=100;
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

function cancelPopup(animCalibration){
    $(".popup").hide();
    $(".background").css("filter","none");
    $(".background").css("opacity","1");
    $("#calibration-step1").show();
    $("#calibration-step2").hide();
    $("#calibration-step3").hide();
    clearInterval(animCalibration);
}

function resetExperiment(running, calibrating, animCalibration){
    if (running){
        $("#response-container").hide();
        $("#trial-container").hide();
        $("#help").hide();
        $("#form-container").show();
        //$("#name").val("");
        $("body").css("background-color","#39302a");
    }else if(calibrating){
        cancelPopup(animCalibration);
    }
}


function selectStimuli(files) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (!f.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/>'].join('');
          document.getElementById('list').insertBefore(span, null);
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

  Math.getDistance = function( x1, y1, x2, y2 ) {
	
	var 	xs = x2 - x1,
		ys = y2 - y1;		
	
	xs *= xs;
	ys *= ys;
	 
	return Math.sqrt( xs + ys );
};

function nextTrial(stimulus, currentSlice, numSlices){
    $("#stimulus #stimulus-img").replaceWith(stimulus);
    $("#stimulus-slice").text("Slice: "+(currentSlice+1));
    $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
}

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  function popupWindow(url, title, win, w, h) {
    const y = win.top.outerHeight / 2 + win.top.screenY - ( h / 2);
    const x = win.top.outerWidth / 2 + win.top.screenX - ( w / 2);
    return win.open(url, title, `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`);
}