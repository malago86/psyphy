

function moveLoadingBar(loaded, max){
    loaded++;
    if(loaded==max){
        $("#loading-bar").hide();
        $("#trial-container").css("display","table");
        $("#loading-bar-progress").css("width","0%");
        //console.log("move",loadingInfo);
        if(!loadingInfo)
            $("#stimulus-container").show();
        stimulusOn=Date.now();
        if(arr.config.options.timeout>0 && loading){
            timeout=setTimeout(
                showResponse,
                arr.config.options.timeout,
                arr.config.options.ratings,
                arr.data.length+1
                );
        }
        running=true; loading=false;
    }
    else
        $("#loading-bar-progress").css("width",(100*(loaded+1)/max)+"%");
}
function load_stimuli_drive(list,info,feedback){
    MAFC=false;
    if(arr.config.options.multiple.localeCompare("first")==0)
        list=[list[0]];
    else if(arr.config.options.multiple.localeCompare("MAFC")==0){
        $("#stimulus").html("");
        $("#stimulus").addClass("mafc"+list.length);
        MAFC=true;
    }
    

    $("#loading-bar").show();
    $("#trial-container").hide();
    loaded=0;
    loading=true;
    running=false;
    var stimuli = {img:[],info:null};

    stimuli.info={};
    if(info){
        loadingInfo=true;
        $("#stimulus-container").hide();
        
        $.getJSON("/php/getJson.php?id="+info.id,function( data ) {
            stimuli.info=data;
            if(stimuli.info.text && preparation==false){
                $("#trial-container .text").css( "display", "table" );
                $("#trial-container .text div").html(stimuli.info.text);
                preparation=true;
            }else{
                $("#stimulus-container").show();
            }
            loadingInfo=false;
        }).fail(function() {
            loadingInfo=false;
            $("#stimulus-container").show();
        });
    }

    
    for(i=0;i<list.length;i++){
        if(list[i].name.includes("mp4") || list[i].name.includes("webm")){
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
        stimuli.img[i].setAttribute("class","stimulus-img");
        stimuli.img[i].setAttribute("numImg",i+1);
        
        stimuli.img[i].onload = function() { 
            loaded++;
            if(loaded==list.length && loading){
                $("#loading-bar").hide();
                $("#trial-container").css("display","table");
                $("#loading-bar-progress").css("width","0%")
                $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/list.length+"%");
                stimulusOn=Date.now();
                if(arr.config.options.timeout>0 && loading){
                    timeout=setTimeout(
                        showResponse,
                        arr.config.options.timeout,
                        arr.config.options.ratings,
                        arr.data.length+1
                        );
                }
                running=true; loading=false;
            }
            else
                $("#loading-bar-progress").css("width",(100*(loaded+1)/list.length)+"%");
        }
        //stimuli.img[i].src = "https://drive.google.com/uc?export=view&id="+list[i].id;
        stimuli.img[i].src = "/php/getStimuli.php?file-id="+list[i].id+"&name="+list[i].name;

        if(MAFC){
            $("#stimulus").append(stimuli.img[i]);
        }
    }
    if(MAFC){
        stimuli.slices=1;
        $("#stimulus").randomize(".stimulus-img");
    }else{
        stimuli.slices=list.length;
        $("#stimulus .stimulus-img").replaceWith(stimuli.img[0]);
    }

    
    
    if(feedback){
        if(feedback.name.includes("mp4") || feedback.name.includes("webm")){
            stimuli.feedback=document.createElement("video");
            stimuli.feedback.autoplay = true;
        }else{
            stimuli.feedback=new Image();
            stimuli.feedback.stimId="feedback";
        }
        stimuli.feedback.setAttribute("class","stimulus-img");
        stimuli.feedback.setAttribute("numImg","feedback");
        stimuli.feedback.onload = function() { 
            
        }
        //stimuli.feedback.src = "https://drive.google.com/uc?export=view&id="+feedback.id;
        stimuli.feedback.src = "/php/getStimuli.php?file-id="+feedback.id+"&name="+feedback.name;
    }else{
        stimuli.feedback=null;
    }

    if(stimuli.slices>1){
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
    running=false; loading=true;
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
                    $("#trial-container").css("display","table");
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
            stimuli.img[i].setAttribute("class","stimulus-img");
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
    running=true; loading=false;

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

    //console.log(canvas.img[1]);

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

function showResponse(ratings, trialNumber){
    stimulusOff=Date.now();
    if(!running) return;
    
    responding=true;
    $("#trial-container").hide();
    $("#confidence-scale").text("");

    if(stimuli.info.customResponse){
        if(!Array.isArray(stimuli.info.customResponse))
            stimuli.info.customResponse=Array(stimuli.info.customResponse);
        for(r=0;r<stimuli.info.customResponse.length;r++){
            if(stimuli.info.customResponse[r].type=="rating"){
                q=jQuery('<div/>', {
                    "class": 'question',
                    "num": r+1,
                    "value": -1,
                }).appendTo('#confidence-scale');
                q.append("<div>"+stimuli.info.customResponse[r].question+"</div>");
                if(stimuli.info.customResponse[r].max==undefined) stimuli.info.customResponse[r].max=8;
                if(stimuli.info.customResponse[r].max<=10){
                    for(i=0;i<stimuli.info.customResponse[r].max;i++){
                        if(i<stimuli.info.customResponse[r].max/2) divclass="absent";
                        else divclass="present";
                        //console.log('rating '+divclass);
                        jQuery('<div/>', {
                            "class": 'rating '+divclass,
                            "num": i+1,
                            title: i+1,
                            text: i+1
                        }).appendTo(q);
                    }
                }else{
                    q.append('<div class="slidecontainer"> \
                        <div class="slider-value response" value='+Math.floor(stimuli.info.customResponse[r].max/2)+'>'+Math.floor(stimuli.info.customResponse[r].max/2)+'</div> \
                        <input type="range" min="1" max="'+stimuli.info.customResponse[r].max+'" value="'+Math.floor(stimuli.info.customResponse[r].max/2)+'" class="slider"> \
                    </div>');
                }
            }else if(stimuli.info.customResponse[r].type=="text"){
                q=jQuery('<div/>', {
                    "class": 'question',
                    "num": r+1,
                    "value": -1,
                }).appendTo('#confidence-scale');
                q.append("<div>"+stimuli.info.customResponse[r].question+"</div>");
                q.append('<input type="text" class="textresponse" maxlength="100" placeholder="Write your answer">');
            }else if(stimuli.info.customResponse[r].type=="select"){
                q=jQuery('<div/>', {
                    "class": 'question',
                    "num": r+1,
                    "value": -1,
                }).appendTo('#confidence-scale');
                q.append("<div>"+stimuli.info.customResponse[r].question+"</div>");
                for(i=0;i<stimuli.info.customResponse[r].options.length;i++){
                    //console.log('rating '+divclass);
                    jQuery('<div/>', {
                        "class": 'rating option',
                        "num": stimuli.info.customResponse[r].options[i],
                        title: stimuli.info.customResponse[r].options[i],
                        text: stimuli.info.customResponse[r].options[i]
                    }).appendTo(q);
                }
            }
        }
    }else{
        if(arr.config.options.ratings==1){
            //calibrated=false;
            saveTrial(-1);
            return;
        }

        q=jQuery('<div/>', {
            "class": 'question',
            "num": 1,
            "value": -1,
        }).appendTo('#confidence-scale');
        
        for(i=0;i<ratings;i++){
            if(i<ratings/2) divclass="absent";
            else divclass="present";
            //console.log('rating '+divclass);
            jQuery('<div/>', {
                "class": 'rating '+divclass,
                "num": i+1,
                title: i+1,
                text: i+1
            }).appendTo(q);
        }
    }
    $("#response-container").css("display","table");
    $("#response-text").text("Trial: "+(trialNumber));
    $('#confidence-scale').append("<br><br>Press SPACEBAR to continue");
    $("#help").hide();
}
  
function finishExperiment(arr){
    results={results:JSON.stringify(arr)};
    
    $.ajax({
        type: "POST",
        url: "/php/upload.php",
        data: results,
        dataType: "json",
        success: function(data){
            //console.log("SUCCESS");
            //console.log(data["responseText"]);
        },
        error: function(data){
            //console.log("ERROR");
            //console.log(data["responseText"]);
            //console.log(data);
        }
    });

    var hiddenElement = document.createElement('a');

    hiddenElement.href = 'data:attachment/text,' + JSON.stringify(arr);
    hiddenElement.target = '_blank';
    hiddenElement.id= 'download';
    
    hiddenElement.download = arr.name+'.pso';

    hiddenElement.text='You can also download your data here';

    $("#download-data").html(hiddenElement);
}

function getDisplayParameters(){
    
    if (running || loading){
        var img = document.querySelector("#stimulus .stimulus-img");

        
        //$('#help #monitor-size').html("Monitor: "+parseInt(display.monitorWidth)+" by "+parseInt(display.monitorHeight) +" cm");
        $('#help #resolution').html("Resolution: "+screen.width+" by "+screen.height);
        $('#help #image-size').html("Stimulus: "+img.width+" by "+img.height);
        $('#help #image-real-size').html("Stimulus original: "+img.naturalWidth+" by "+img.naturalHeight);
        arr.config.display.stimulusWidth=img.width;
        arr.config.display.stimulusHeight=img.height;


        /*
        ratio=img.naturalWidth/img.width;
        //console.log(ratio);
        pixelsPerCM=screen.width/display.monitorWidth;
        distance=(1/display.degreesPerPixel)/Math.tan(1 * Math.PI/180)/pixelsPerCM/ratio;

        $('#help #distance-required').html("Distance required: "+parseInt(distance)+" cm");
        */
        arr.config.display.blindSpotDistance=blindSpotDistance;
        arr.config.display.pixelsPerDegree.push([(mean(arr.config.display.blindSpotDistance)/blindSpotDegrees),Date.now()]);
        distance=(arr.config.display.pixelsPerDegree.slice(-1)[0][0]*(1/arr.config.display.pixelsPerCM)/Math.tan(1 * Math.PI/180));
        arr.config.display.distance.push([distance,Date.now()]);

        $('#help #distance-required').html("Distance: "+parseInt(distance)+" cm ("+parseInt(distance/2.54)+" in)");
    }
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
    if (running || loading){
        if(timeout!=false)
            clearTimeout(timeout);
        $("#loading-bar").hide();
        $("#response-container").hide();
        $("#trial-container").hide();
        $("#help").hide();
        $("#form-container").show();
        //$("#name").val("");
        $("body").css("background-color","#39302a");
        $(".error").html("<i class='fas fa-exclamation-circle'></i> Please keep fullscreen mode and do not leave the browser, experiment has been reset!");
        $(".error").show();
    }
    if(calibrating){
        cancelPopup(animCalibration);
    }
    calibrated=running=loading=false;
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
var savedResponses=-1;
function saveTrial(responses){
    $("#response-container").hide();

    if(!showingFeedback && stimuli.feedback){
        $("#feedback-container .cell .stimulus-img").replaceWith(stimuli.feedback);
        $("#feedback-container").css("display","table");
        showingFeedback=true;
        savedResponses=responses;
        return false;
    }
    
    showingFeedback=false;
    if(!calibrated && !cheatCode){
        calibrating=true;
        document.documentElement.requestFullscreen();
        blindSpotDistance=[];
        $("#calibration").show();
        $(".background").css("filter","blur(4px)");
        $(".background").css("opacity",".4");
        savedResponses=rating;
    }else{
        if(savedResponses!=-1){
            responses=savedResponses;
            savedResponses=-1;
        }
        arr.data.push({
            trialID:trialSequence[sortIndexes[trialID]],
            responses:responses,
            info:stimuli.info,
            stimulusOn:stimulusOn,
            stimulusOff:stimulusOff,
            condition:conditionSequence[sortIndexes[trialID]],
            marks:marks,
            });
        //console.log(arr);
        currentSlice=0;
        if(arr.data.length==arr.config.maxTrials){
            //finish
            arr.stopTime=Date.now();
            running=false;
            $("#trial-container").hide();
            $("#finished-container").show();
            finishExperiment(arr);
        }else{
            trialID=trialSequence[arr.data.length];
            marks=[];
            $(".mark").remove();
            //console.log(trialSequence);
            //$("#trial-container").show();
            //stimuli=load_stimuli(stimuli_name);
        
            if(!arr.config.conditions){
                stimuli_name="stimuli/"+(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);
                stimuli=load_stimuli(stimuli_name);
            }else{
                if(trialSequence[sortIndexes[trialID]] in arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.feedbackFiles){
                    stimuli=load_stimuli_drive(arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.stimulusFiles[trialSequence[sortIndexes[trialID]]],
                        arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.infoFiles[trialSequence[sortIndexes[trialID]]],
                        arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.feedbackFiles[trialSequence[sortIndexes[trialID]]]);
                }else{
                    stimuli=load_stimuli_drive(arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.stimulusFiles[trialSequence[sortIndexes[trialID]]],
                        arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.infoFiles[trialSequence[sortIndexes[trialID]]],
                        null);
                }
            }
            
            if((Date.now()-arr.config.display.pixelsPerDegree.slice(-1)[0][1]) > 600000) // recalibrate every 10 minutes
                calibrated=false;
            nextTrial(currentSlice, numSlices);
            
        }
    }
}

function nextTrial(currentSlice, numSlices){
    
    if(!calibrated && !cheatCode){
        calibrating=true;
        document.documentElement.requestFullscreen();
        blindSpotDistance=[];
        $("#calibration").show();
        $(".background").css("filter","blur(4px)");
        $(".background").css("opacity",".4");
        $("#calibration-step1").hide();
        $("#calibration-step2").show();
        $("#calibration-step3").hide();
        clearInterval(animCalibration);
        animCalibration=calibrationMove($("#calibration-step2 .blind-spot-dot"));
    }
    $("#stimulus-slice").text("Slice: "+(currentSlice+1));
    $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
    $("#trial-number").text("Trial: "+(arr.data.length+1));
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

function createUUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

$.fn.randomize = function(selector){
    (selector ? this.find(selector) : this).parent().each(function(){
        $(this).children(selector).sort(function(){
            return Math.random() - 0.5;
        }).detach().appendTo(this);
    });

    return this;
};

function loadExperimentData(data){
    arr.config.options={};
    for(key in data.options){
        //console.log(key);
        arr.config.options[key]=data.options[key];
    }
    instructions="";
    if(validURL(arr.config.options.instructions)){
        instructions="<h2><a href='"+arr.config.options.instructions+"' target='popup' onclick=\"popupWindow('"+arr.config.options.instructions+"', 'popup', window, 800, 800);\">Read instructions for this experiment</a></h2>"
    }

    $("#form-box").html("<h3>Experiment <strong>"+data["options"]["title"]+"</strong> loaded!</h3>"+instructions+"<p><a href='/'>Reset</a></p>");
    document.title = data["options"]["title"]+' - PSY'+String.fromCodePoint(0x26AA)+'PHY';
    //arr.config.ratings=data["ratings"];
    //arr.config.name=data["title"];
    arr.config.conditions=data["conditions"];
}