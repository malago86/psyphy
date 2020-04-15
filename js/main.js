
var arr={};
var count=0;
arr={config: {name: ""}, data:[]};

$( document ).ready(function() {
    var currentSlice=1;
    var parentOffset = null;
    var prevX,prevY,relX,relY;
    var scrollSpeed=8;
    var numSlices=100;

    var running=false;
    
    var calibrated=false;
    var calibrating=false;
    var blindSpotDistance=[];
    var pixelsPerCM=0;
    var animCalibration=-1;
    

    var maxTrials=20;
    var trialID=1;

    var stimuli=null;
    var stimuli_name="noise"+trialID;

    var trialSequence=null;
    var presenceSequence=null;
    var stimulusOn=null;
    var display=null;
    var degreesPerPixel=0.022;
    var monitorHeight,monitorWidth;

    var ccWidthCM=8.560;
    var blindSpotDegrees=13; //13.59

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
        maxTrials = Math.min(50,$("#maxTrials").val());
        presence = $("#presence").val();
        ratings = $("#ratings").val();
        monitorHeight = $("#height").val();
        monitorWidth = $("#width").val();
        trialSequence= Array.from(Array(maxTrials).keys());
        //trialSequence.sort(function(a, b) {return 0.5 - Math.random()});
        presenceSequence=Array.from(Array(parseInt(maxTrials*presence/100)), () => 1);
        presenceSequence=presenceSequence.concat(Array.from(Array(parseInt(maxTrials*(1-presence/100))), () => 0));
        //console.log(presenceSequence);
        
        trialID=trialSequence[arr.data.length];
        
        currentSlice=1;
        

		if(name==""){
			name="Test Participant";
        }

        arr={config: {
                name: name,
                maxTrials: maxTrials,
                presence: presence,
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
                }
            },
            startTime:Date.now(),
            data:[]
        };

        document.documentElement.requestFullscreen();

        stimuli_name=(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);

        $("#form-container").hide();
        $("#trial-container").hide();
        stimuli=load_stimuli(stimuli_name);
        numSlices=stimuli.slices;
        //console.log(stimuli);
        $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
        $("#loading-bar").hide();
        $("#trial-container").show();
        running=true;
        $("body").css("background-color","rgb(128,128,128)");
        stimulusOn=Date.now();
    });

    $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
    $(window).bind('mousewheel DOMMouseScroll', function(event){
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            // scroll up
            currentSlice-=1;
        }
        else {
            // scroll down
            currentSlice+=1;
        }
        currentSlice=Math.max(1,Math.min(numSlices,currentSlice));
        //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
        $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
        $("#stimulus-slice").text("Slice: "+currentSlice);
        $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
    });

    $("#stimulus").draggable({
        start: function(e) {
            parentOffset = $(this).offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            prevX=relX;
            prevY=relY;
        },
        drag: function(e) {
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
            currentSlice=Math.max(1,Math.min(numSlices,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+currentSlice);
            $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
        },
        stop: function(e) {
      
        },
        helper: function( event ) {
            return $( "<div class='ui-widget-header' style='display:none'>I'm a custom helper</div>" );
          }
    });

    $("#stimulus-scroll-bar").draggable({
        start: function(e) {
            parentOffset = $(this).offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(1,Math.min(numSlices,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+currentSlice);
            $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
        },
        drag: function(e) {
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(1,Math.min(numSlices,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+currentSlice);
            $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
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
                    $("#trial-container").hide();
                    show_confidence_ratings(ratings);
                    $("#response-container").show();
                    $("#response-text").text("Trial: "+(arr.data.length+1));
                    $("#help").hide();
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
            trialID:trialID,
            rating:rating,
            present:presenceSequence[trialID],
            signalType:stimuli.info.signalSize<10?"MCALC":"MASS",
            locations:stimuli.info.locations,
            contrast:stimuli.info.contrast,
            stimulusOn:stimulusOn,
            stimulusOff:Date.now()
            });
        //console.log(arr);
        currentSlice=1;
        if(arr.data.length==maxTrials){
            //finish
            arr.stopTime=Date.now();
            running=false;
            $("#response-container").hide();
            $("#finished-container").show();
            finishExperiment(arr);
        }else{
            trialID=trialSequence[arr.data.length];
            //console.log(trialSequence);
            stimuli_name=(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);
            $("#response-container").hide();
            $("#trial-container").show();
            stimuli=load_stimuli(stimuli_name);
            $("#stimulus img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+currentSlice);
            $("#stimulus-scroll-position").css("height",100*currentSlice/numSlices+"%");
            stimulusOn=Date.now();
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
        title=$("#experimentTitle").val();
        if(title=="")
            title="Experiment";

        options={title:title,
                 maxTrials:$("#maxTrials").val(),
                 presence:$("#presence").val(),
                 ratings:$("#ratings").val()
                };

        var hiddenElement = document.createElement('a');

        hiddenElement.href = 'data:attachment/text,' + JSON.stringify(options);
        hiddenElement.target = '_blank';
        hiddenElement.id= 'download';
        
        hiddenElement.download = title+'.psychonline';

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
          console.log(data["maxTrials"]);
          $("#experimentTitle").val(data["title"]);
          $("#maxTrials").val(data["maxTrials"]);
          $("#presence").val(data["presence"]);
          $("#ratings").val(data["ratings"]);
          //console.log(e.target.result, JSON.parse(fileReader.result))
        };
        data=fileReader.readAsText($('#load-experiment').prop('files')[0]);
        //console.log(data);
    });
    
});