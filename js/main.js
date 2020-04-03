
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

    $("#start-experiment").click(function(e){

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
        

		if(name=="" || monitorHeight=="" || monitorWidth==""){
			return;
        }
        if($("#units option:selected" ).text()=="inches"){
            monitorHeight=monitorHeight*2.54;
            monitorWidth=monitorWidth*2.54;
        }

        arr={config: {
                name: name,
                maxTrials: maxTrials,
                presence: presence,
                display:{
                    degreesPerPixel:degreesPerPixel,
                    monitorHeight:monitorHeight,
                    monitorWidth:monitorWidth,
                    stimulusHeight:null,
                    stimulusWidth:null,
                    distance:null,
                    windowWidth:window.innerWidth,
                    windowHeight:window.innerHeight,
                }
            },
            startTime:Date.now(),
            data:[]
        };

        //document.documentElement.requestFullscreen();

        stimuli_name=(presenceSequence[trialID]?"present":"absent")+"/noise"+(trialID+1);

        $("#form-container").hide();
        $("#trial-container").hide();
        stimuli=load_stimuli(stimuli_name);
        numSlices=stimuli.slices;
        console.log(stimuli);
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

    $(document).on( 
        'keydown', function(event) { 
            if(running){
                getDisplayParameters(arr["config"]["display"]);
                if(event.which==32){ //spacebar
                    $("#trial-container").hide();
                    show_confidence_ratings(ratings);
                    $("#response-container").show();
                    $("#response-text").text("Trial: "+(arr.data.length+1));
                    $("#help").hide();
                }else if (event.key == "Escape") { 
                    running=false;
                    $("#response-container").hide();
                    $("#trial-container").hide();
                    $("#form-container").show();
                    $("#name").val("");
                    $("body").css("background-color","#39302a");
                    $("#help").hide();
                } else if(event.key=="h"){
                    $("#help").toggle();
                }
            }
      }); 

    document.addEventListener("fullscreenchange", function (event) {
        if (document.fullscreenElement) {
            // fullscreen is activated
        } else {
            // fullscreen is cancelled
            /*running=false;
            $("#response-container").hide();
            $("#trial-container").hide();
            $("#form-container").show();
            //$("#name").val("");
            $("body").css("background-color","#39302a");*/
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
        display=getDisplayParameters(arr["config"]["display"]);
        $("#stimulus").css("text-align","none");
        $("#stimulus").css("text-align","center");
    });


    $(".question-mark").click(function(){
        $("#popup").toggle();
    });
    $("#close").click(function(){
        $("#popup").toggle();
    });
    
});