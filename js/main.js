
var version="0.1";


var count=0;
var arr={name: "",config: {options:{}}, data:[]};
var stimuli=null;
var calibrated=true;
var running=false;
var preparation=false;
 
var stimulusOn=null;
var stimulusOff=null;
var currentSlice=0;

$( document ).ready(function() {
    $("#version").text(version);
    
    var parentOffset = null;
    var prevX,prevY,relX,relY;
    var scrollSpeed=8;
    var numSlices=100;

    var calibrating=false;
    var blindSpotDistance=[];
    var pixelsPerCM=0;
    var animCalibration=-1;
    

    var maxTrials=20;
    var trialID=1;
    
    var stimuli_name="noise"+trialID;

    var trialSequence=null;
    var presenceSequence=null;
    
    var display=null;
    var degreesPerPixel=0.022;
    var monitorHeight,monitorWidth;

    var ccWidthCM=8.560;
    var blindSpotDegrees=13; //13.59

    var marks=[];

    $("#start-experiment").click(function(e){
        if(!calibrated){
            calibrating=true;
            document.documentElement.requestFullscreen();
            blindSpotDistance=[];
            $("#calibration").show();
            $(".background").css("filter","blur(4px)");
            $(".background").css("opacity",".4");
            return false;
        }

        name = $("#name").val();
        //maxTrials = Math.min(50,$("#maxTrials").val());
        presence = 50;
        ratings = $("#ratings").val();

        monitorHeight = $("#height").val();
        monitorWidth = $("#width").val();
        trialSequence= Array.from(Array(maxTrials).keys());
        //trialSequence.sort(function(a, b) {return 0.5 - Math.random()});
        presenceSequence=Array.from(Array(parseInt(maxTrials*presence/100)), () => 1);
        presenceSequence=presenceSequence.concat(Array.from(Array(parseInt(maxTrials*(1-presence/100))), () => 0));
        //TODO: CONDITION SEQUENCE PER NUMBER OF TRIALS
        
        trialID=trialSequence[arr.data.length];

        
        
        currentSlice=0;
        

		if(name==""){
			name="Test Participant";
        }

        arr={config: {
                maxTrials: maxTrials,
                display:{
                    degreesPerPixel:degreesPerPixel,
                    stimulusHeight:null,
                    stimulusWidth:null,
                    distance:null,
                    windowWidth:window.innerWidth,
                    windowHeight:window.innerHeight,
                    pixelsPerCM:pixelsPerCM,
                    blindSpotDistance:blindSpotDistance,
                    pixelsPerDegree:(mean(blindSpotDistance)/blindSpotDegrees),
                },
                conditions:arr.config.conditions,
                options:arr.config.options,
                version:version,
            },
            startTime:Date.now(),
            data:[]
        };

        document.documentElement.requestFullscreen();

        //
        marks=[];
        $(".mark").remove();

        $("#form-container").hide();
        //$("#trial-container").hide();
        
        //stimuli=load_stimuli(stimuli_name);
        if(!arr.config.conditions){
            stimuli_name="stimuli/"+(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);
            stimuli=load_stimuli(stimuli_name);
            arr.name=name;
            arr.config.options.ratings=ratings;
            sortIndexes=trialSequence;
            conditionSequence=presenceSequence;
        }else{
            conditionSequence=[];
            trialSequence=[];
            numConditions=arr.config.conditions.length;
            for(i=0;i<numConditions;i++){
                trialSequence=trialSequence.concat(Array.from({length:arr.config.conditions[i].stimuli.stimulusFiles.length},(v,k)=>k));
                conditionSequence=conditionSequence.concat(Array.from({length:arr.config.conditions[i].stimuli.stimulusFiles.length},(v,k)=>i));
            }

            sortIndexes=Array.from({length:conditionSequence.length},(v,k)=>k);
            sortIndexes.sort(function(a, b) {return 0.5 - Math.random()});

            arr.name=name;
            arr.sortIndexes=sortIndexes;
            arr.trialSequence=trialSequence;
            arr.conditionSequence=conditionSequence;
            arr.config.maxTrials=sortIndexes.length;

            stimuli=load_stimuli_drive(arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.stimulusFiles[trialSequence[sortIndexes[trialID]]],
                arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.infoFiles[trialSequence[sortIndexes[trialID]]]);
        }
        //console.log(stimuli);
        //document.body.appendChild(stimuli.img[1]);
        numSlices=stimuli.slices;


        nextTrial(stimuli.img[currentSlice], currentSlice, numSlices);
        
        //$("#trial-container").show();
        //running=true;
        $("body").css("background-color","rgb(128,128,128)");
        
    });

    $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
    $(window).bind('mousewheel DOMMouseScroll', function(event){
        if(!running) return;
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            // scroll up
            currentSlice-=1;
        }
        else {
            // scroll down
            currentSlice+=1;
        }
        currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
        //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
        $("#stimulus #stimulus-img").replaceWith(stimuli.img[currentSlice]);
        
        /*var sp2 = document.getElementById("stimulus");
        console.log(stimuli.img[currentSlice]);
        sp2.replaceChild(stimuli.img[currentSlice], sp2.childNodes[0]);*/
        //$("#stimulus #stimulus-img").attr("src",stimuli.img[currentSlice]);

        $("#stimulus-slice").text("Slice: "+(currentSlice+1));
        $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
    });

    $("#stimulus").draggable({
        start: function(e) {
            if(!running) return;
            parentOffset = $(this).offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            prevX=relX;
            prevY=relY;
        },
        drag: function(e) {
            if(!running) return;
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            //console.log(relX,relY);
            if(relY>prevY+scrollSpeed) {
                currentSlice+=1;
                prevX=relX;
                prevY=relY;
            }else if(relY<prevY-scrollSpeed) {
                currentSlice-=1;
                prevX=relX;
                prevY=relY;
            }
            currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus #stimulus-img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+(currentSlice+1));
            $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
        },
        stop: function(e) {
      
        },
        helper: function( event ) {
            return $( "<div class='ui-widget-header' style='display:none'>I'm a custom helper</div>" );
          }
    });

    $("#stimulus-scroll-bar").draggable({
        start: function(e) {
            if(!running) return;
            parentOffset = $(this).offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus #stimulus-i1mg").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+(currentSlice+1));
            $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
        },
        drag: function(e) {
            if(!running) return;
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus #stimulus-img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+(currentSlice+1));
            $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
        },
        stop: function(e) {
      
        },
        helper: function( event ) {
            return $( "<div class='ui-widget-header' style='display:none'>I'm a custom helper</div>" );
          }
    });

    var currentSize=50;
    var ccRatio=1.5857725083364208966283808818081;
    $("#calibration .credit-card-slider-position").draggable({
        start: function(e) {
            parentOffset = $(this).parent().offset(); 
            
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSize=Math.round(100*relX/$(this).parent().width());
            //console.log($(this).parent().width(),relX,currentSize);
            currentSize=Math.max(-2,Math.min(currentSize,98));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#calibration .credit-card-slider-position").css("left",currentSize+"%");
            $("#calibration .credit-card-outline").css("width",(100+(currentSize*300/100))+"px");
            $("#calibration .credit-card-outline").css("height",((100+(currentSize*300/100))/ccRatio)+"px");

            
        },
        drag: function(e) {
            parentOffset = $(this).parent().offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSize=Math.round(100*relX/$(this).parent().width());
            //console.log($(this).parent().width(),relX,currentSize);
            currentSize=Math.max(-2,Math.min(currentSize,98));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#calibration .credit-card-slider-position").css("left",currentSize+"%");
            $("#calibration .credit-card-outline").css("width",(200+(currentSize*300/100))+"px");
            $("#calibration .credit-card-outline").css("height",((200+(currentSize*300/100))/ccRatio)+"px");
            $("#calibration .credit-card-slider-position").css("border","3px solid rgb(229, 72, 35)");
        },
        stop: function(e) {
            $("#calibration .credit-card-slider-position").css("border","3px solid white");
        },
        helper: function( event ) {
            return $( "<div class='ui-widget-header' style='display:none'>I'm a custom helper</div>" );
          }
    });

    $(document).on( 
        'keydown', function(event) { 
            //console.log(running,calibrating);
            if(running){
                getDisplayParameters(arr["config"]["display"]);
                if(event.which==32){ //spacebar
                    if(preparation){
                        preparation=false;
                        stimulusOn=Date.now();
                        $("#trial-container .text").hide();
                        //nextTrial(currentSlice,numSlices);
                        return;
                    }
                    showConfidenceRatings(arr.config.options.ratings,arr.data.length+1);
                }else if(event.key=="Enter"){
                    if($("#stimulus #stimulus-img").is("video")){
                        $("#stimulus #stimulus-img").trigger( $("#stimulus #stimulus-img").prop('paused') ? 'play' : 'pause');
                    }
                }else if (event.key == "Escape") { 
                    /*$("#response-container").hide();
                    $("#trial-container").hide();
                    $("#form-container").show();
                    $("#name").val("");
                    $("body").css("background-color","#39302a");
                    $("#help").hide();*/
                    resetExperiment(running, calibrating, animCalibration);
                } else if(event.key=="h"){
                    $("#help").toggle();
                }
            }else if(calibrating){
                if(event.which==32 && $("#calibration-step2").is(":visible")){ //spacebar
                    r1=$("#calibration-step2 .blind-spot-dot").css("right");
                    r2=$("#calibration-step2 .blind-spot-cross").css("right");
                    w2=$("#calibration-step2 .blind-spot-cross").css("width");
                    r1=parseInt(r1.substr(0,r1.length-2));
                    r2=parseInt(r2.substr(0,r2.length-2));
                    w2=parseInt(w2.substr(0,w2.length-2))/2;
                    blindSpotDistance.push(r1-(r2-w2));
                    $("#calibration-step2 .blind-spot-dot").css("right","100px");
                    clearInterval(animCalibration);
                    animCalibration=calibrationMove($("#calibration-step2 .blind-spot-dot"));
                    if(blindSpotDistance.length>10){
                        $("#calibration-step2").toggle();
                        $("#calibration-step3").toggle();
                        calibrated=true;
                        clearInterval(animCalibration);
                    }
                    return false;
                }else if(event.key=="Escape"){
                    cancelPopup(animCalibration);
                    calibrating=false;
                }
            }
    }); 

    $("#stimulus").dblclick(function(event){ //double click event
        //console.log(event.target, event.offsetX,event.offsetY);
        if(arr.config.options.mark.localeCompare("true")==0){
            et=$(event.target);
            //console.log(et,"double");
            if(et.is("circle") || et.is("svg")){
                var parentOffset = $(this).parent().offset(); 
                var relX = event.pageX - parentOffset.left;
                var relY = event.pageY - parentOffset.top;
            }else{
                var relX=event.offsetX;
                var relY=event.offsetY;
            }
            $(".mark").remove();
        
            found=false;
            for(i=marks.length-1;i>=0;i--){
                //console.log(i,relX,relY,marks[i][0],marks[i][1],Math.getDistance(relX,relY,marks[i][0],marks[i][1]));
                if(Math.getDistance(relX,relY,marks[i][0],marks[i][1])<40){
                    //delete mark
                    marks.splice(i,1);
                    found=true;
                }
            }
            if(!found)
                marks.push(Array(relX,relY, parseInt($("#stimulus #stimulus-img").attr("numImg"))));
            //console.log(marks);
            for(i=0;i<marks.length;i++){
                newelement=$('<svg height="100" width="100"><circle cx="50" cy="50" r="40" stroke="white" stroke-width="4" fill="transparent" /></svg>');
                newelement.addClass("mark");
                newelement.appendTo($(this));
                newelement.css({
                    "left":marks[i][0]-newelement.width()/2+"px",
                    "top" :marks[i][1]-newelement.height()/2+"px"
                });
            }
        }

    
    });

    document.addEventListener("fullscreenchange", function (event) {
        if (document.fullscreenElement) {
            // fullscreen is activated
        } else {
            // fullscreen is cancelled
            resetExperiment(running, calibrating, animCalibration);
            calibrated=running=false;
        }
    });

    $('body').on('click', '.rating',function(e) { 
        rating = $(this).attr("num");
        //console.log(stimuli.info);
        arr.data.push({
            trialID:trialSequence[sortIndexes[trialID]],
            rating:rating,
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
            $("#response-container").hide();
            $("#finished-container").show();
            finishExperiment(arr);
        }else{
            trialID=trialSequence[arr.data.length];
            marks=[];
            $(".mark").remove();
            //console.log(trialSequence);
            $("#response-container").hide();
            //$("#trial-container").show();
            //stimuli=load_stimuli(stimuli_name);
            if(!arr.config.conditions){
                stimuli_name="stimuli/"+(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);
                stimuli=load_stimuli(stimuli_name);
            }else{
                stimuli=load_stimuli_drive(arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.stimulusFiles[trialSequence[sortIndexes[trialID]]],
                    arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.infoFiles[trialSequence[sortIndexes[trialID]]]);
            }
            nextTrial(stimuli.img[currentSlice], currentSlice, numSlices);

        }
        return false;
    });

    $( window ).resize(function() {
        //display=getDisplayParameters(arr["config"]["display"]);
        //$("#stimulus").css("text-align","none");
        //$("#stimulus").css("text-align","center");
        if (!document.fullscreenElement){
            resetExperiment(running, calibrating, animCalibration);
            calibrated=running=false;
        }
    });


    $(".question-mark").click(function(){
        $("#help-screen").toggle();
    });
    $(".close").click(function(){
        cancelPopup(animCalibration);
        calibrating=false;
    });
    $("#calibration-step1 .button").click(function(){
        left=$("#calibration .credit-card-outline").css("width");
        $("#calibration-step1").toggle();
        $("#calibration-step2").toggle();
        left=parseInt(left.substr(0,left.length-2));
        //console.log(left);
        pixelsPerCM=ccWidthCM/left;
        animCalibration=calibrationMove($("#calibration-step2 .blind-spot-dot"));
    });
    $("#calibration-step3 .button").click(function(){
        $(".background").css("filter","none");
        $(".background").css("opacity","1");
        $("#calibration-step1").toggle();
        $("#calibration-step3").toggle();
        $("#calibration").toggle();
        calibrating=false;
    });
    
    $("#create-experiment").click(function(){
        if($(this).hasClass("disabled")) return false;
        
        fields=$("#form-box").find("input");
        options={};
        for(f=0;f<fields.length;f++){
            if(fields[f].type.localeCompare("button")!=0){
                name=$(fields[f]).attr("id");
                options[name]=$(fields[f]).val();
            }
        }

        if($("#title").val()=="")
            options["title"]="Experiment";

        download={options:options,
                 conditions:arr.config.conditions};

        var hiddenElement = document.createElement('a');

        hiddenElement.href = 'data:attachment/text,' + JSON.stringify(download);
        hiddenElement.target = '_blank';
        hiddenElement.id= 'download';
        
        hiddenElement.download = options["title"]+'.pso';

        hiddenElement.text='You finished all the trials, click here to download the data';
        hiddenElement.click();
        //document.getElementById('form_container').prepend(document.createElement('br'));
        //document.getElementById('download').replaceWith(hiddenElement);
    });

    $('#load-experiment').on('change', function () {
        var fileReader = new FileReader();
        var data;
        fileReader.onload = function (e) {
          data = JSON.parse(fileReader.result);  // data <-- in this var you have the file data in Base64 format
          
          //$("#experimentTitle").val(data["title"]);
          //$("#ratings").val(data["ratings"]);
          arr.config.options={};
          for(key in data.options){
              //console.log(key);
              arr.config.options[key]=data.options[key];
          }
          instructions="";
          if(validURL(arr.config.options.instructions)){
              instructions="<h2><a href='"+arr.config.options.instructions+"' target='popup' onclick=\"popupWindow('"+arr.config.options.instructions+"', 'popup', window, 800, 800);\">Read instructions for this experiment</a></h2>"
          }

          $("#form-box").html("<h3>Experiment <strong>"+data["options"]["title"]+"</strong> loaded!</h3>"+instructions+"<p><a href='.'>Reset</a></p>");
          //arr.config.ratings=data["ratings"];
          //arr.config.name=data["title"];
          arr.config.conditions=data["conditions"];
          //console.log(e.target.result, JSON.parse(fileReader.result))
        };
        data=fileReader.readAsText($('#load-experiment').prop('files')[0]);
        //console.log(data);
    });

    $("#ratings").on('mousemove',function(){
        $("#slider-value").text($(this).val());  
    });
    
});