
var version="0.1";


var count=0;
var arr={name: "",config: {options:{}}, data:[]};
var stimuli=null;
var calibrated=false;
var calibrating=false;
var animCalibration=-1;
var blindSpotDistance=[];
var blindSpotDegrees=13; //13.59
var running=false;
var loading=false;
var responding=false;
var loaded=0;
var preparation=false;
var showingFeedback=false;

var display=null;
 
var stimulusOn=null;
var stimulusOff=null;
var currentSlice=0;

var timeout=false;
var trialSequence=null;
var trialID=1;
var marks=[];
var numSlices=100;
var cheatCode=false;


$( document ).ready(function() {
    $("#version").text(version);
    
    var parentOffset = null;
    var prevX,prevY,relX,relY;
    var scrollSpeed=8;
    var pixelsPerCM=0;
    
    var maxTrials=20;
    var stimuli_name="noise"+trialID;

    
    var presenceSequence=null;
    
    
    var degreesPerPixel=0.022;
    var monitorHeight,monitorWidth;

    var ccWidthCM=8.560;
    

    

    $("#start-experiment").click(function(e){
        if(!calibrated && !cheatCode){
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
                    distance:[],
                    windowWidth:window.innerWidth,
                    windowHeight:window.innerHeight,
                    pixelsPerCM:pixelsPerCM,
                    blindSpotDistance:blindSpotDistance,
                    pixelsPerDegree:[],
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

            if(!arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.feedbackFiles){
                arr.config.conditions[conditionSequence[sortIndexes[trialID]]].stimuli.feedbackFiles=[];
            }

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
        //console.log(stimuli);
        //document.body.appendChild(stimuli.img[1]);
        numSlices=stimuli.slices;
        if(arr.config.options.multiple.localeCompare("MAFC")==0){
            $("#trial-container .instructions").text("Double click on the signal-present stimulus");
        }else{
            $("#trial-container .instructions").text("Press SPACEBAR to continue");
        }
        getDisplayParameters();
        nextTrial(currentSlice, numSlices);
        
        //$("#trial-container").show();
        //running=true;
        $("body").css("background-color","rgb(128,128,128)");
        
    });

    $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
    $(window).bind('mousewheel DOMMouseScroll', function(event){
        if(!running || numSlices==1) return;
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
        $("#stimulus .stimulus-img").replaceWith(stimuli.img[currentSlice]);
        
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
            if(!running || numSlices==1) return;
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
            $("#stimulus .stimulus-img").replaceWith(stimuli.img[currentSlice]);
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
            if(!running || numSlices==1) return;
            parentOffset = $(this).offset(); 
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus .stimulus-img").replaceWith(stimuli.img[currentSlice]);
            $("#stimulus-slice").text("Slice: "+(currentSlice+1));
            $("#stimulus-scroll-position").css("height",100*(currentSlice+1)/numSlices+"%");
        },
        drag: function(e) {
            if(!running || numSlices==1) return;
            relX = e.pageX - parentOffset.left;
            relY = e.pageY - parentOffset.top;
            currentSlice=Math.round(numSlices*relY/$(this).height());
            currentSlice=Math.max(0,Math.min(numSlices-1,currentSlice));
            //$("#stimulus").attr("src","stimuli/noise1/noise1_"+currentSlice+".jpg");
            $("#stimulus .stimulus-img").replaceWith(stimuli.img[currentSlice]);
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
            console.log(responding);
            if(showingFeedback){
                $("#feedback-container").hide();
                saveTrial(-1);
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
                    if(blindSpotDistance.length>9){
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
            }else if(responding){
                responseDivs=$('.question');
                responses=[];
                for(r=0;r<responseDivs.length;r++){
                    responses.push($(responseDivs[r]).attr("value"));
                }
                saveTrial(responses);
                responding=false;
            }else if(running){
                if(event.which==32){ //spacebar
                    if(preparation){
                        preparation=false;
                        stimulusOn=Date.now();
                        $("#trial-container .text").hide();
                        return;
                    }
                    if($("#stimulus .stimulus-img").is("video")){
                        $("#stimulus .stimulus-img").trigger('pause');
                    }
                    showResponse(arr.config.options.ratings,arr.data.length+1);
                }else if(event.key=="Enter"){
                    if($("#stimulus .stimulus-img").is("video")){
                        $("#stimulus .stimulus-img").trigger( $("#stimulus .stimulus-img").prop('paused') ? 'play' : 'pause');
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
            }
    }); 

    $("#stimulus").dblclick(function(event){ //double click event
        //console.log(event.target, event.offsetX,event.offsetY);
        et=$(event.target);
        if(arr.config.options.multiple.localeCompare("MAFC")==0){
            marks.push(parseInt(et.attr("numImg")));
            showResponse(arr.config.options.ratings,arr.data.length+1);
        }else if(arr.config.options.mark.localeCompare("true")==0){
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
                marks.push(Array(relX,relY, parseInt(et.attr("numImg")), Date.now()));
            //console.log(marks);
            var radius=40;
            for(i=0;i<marks.length;i++){
                newelement=$('<svg height="100" width="100"><circle cx="'+(radius+10)+'" cy="'+(radius+10)+'" r="'+(radius)+'" stroke="white" stroke-width="4" fill="transparent" /></svg>');
                newelement.addClass("mark");
                newelement.appendTo($("#stimulus"));
                newelement.css({
                    "left":marks[i][0]-radius+"px",
                    "top" :marks[i][1]-radius+"px"
                });
            }
        }

    
    });

    document.addEventListener("fullscreenchange", function (event) {
        if (document.fullscreenElement) {
            // fullscreen is activated
        } else if(!cheatCode) {
            // fullscreen is cancelled
            resetExperiment(running, calibrating, animCalibration);
            calibrated=running=loading=false;
        }
    });

    $(window).blur(function(){
        if(!cheatCode) {
            resetExperiment(running, calibrating, animCalibration);
        }
    });

    $('body').on('click', '.rating',function(e) { //click on confidence rating
        rating = $(this).attr("num");
        $(this).siblings(".question").attr("value",rating);
        $(".rating").removeClass("selected");
        $(this).toggleClass("selected");
        return false;
    });

    $('body').on('mousemove', '.slider',function(e) {
        r=$(this).val();
        $(this).parent().find(".slider-value").html(r);  
        $(this).siblings(".question").attr('value',r);  
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
        pixelsPerCM=left/ccWidthCM;
        animCalibration=calibrationMove($("#calibration-step2 .blind-spot-dot"));
    });
    $("#calibration-step3 .button").click(function(){
        $(".background").css("filter","none");
        $(".background").css("opacity","1");
        $("#calibration-step1").toggle();
        $("#calibration-step3").toggle();
        $("#calibration").toggle();
        getDisplayParameters();
        calibrating=false;
    });
    
    $("#create-experiment").click(function(){
        if($(this).hasClass("disabled")) return false;
        
        fields=$("#form-box").find("input, select");
        options={};
        for(f=0;f<fields.length;f++){
            if(fields[f].type.localeCompare("button")!=0){
                name=$(fields[f]).attr("id");
                if(fields[f].type.localeCompare("checkbox")==0){
                    options[name]=$(fields[f]).prop('checked').toString();
                }else{
                    options[name]=$(fields[f]).val();
                }
            }
        }

        if($("#title").val()=="")
            options["title"]="Experiment";

        options["id"]=createUUID();

        download={options:options,
                 conditions:arr.config.conditions};

        $.ajax({
            type: "POST",
            url: "php/createExperiment.php",
            data: {"experiment-id":options["id"],
                   "title":options["title"]},
            dataType: "json",
            success: function(data){
                //console.log("SUCCESS");
                //console.log(data["experiment-id"]);
            },
            error: function(data){
                //console.log("ERROR");
                //console.log(data["experiment-id"]);
            }
        });

        var hiddenElement = document.createElement('a');

        hiddenElement.href = 'data:attachment/text,' + JSON.stringify(download);
        hiddenElement.target = '_blank';
        hiddenElement.id= 'download';
        
        hiddenElement.download = options["title"]+'.pso';

        hiddenElement.text='Download now';
        hiddenElement.click();

        $("#form-box").html("<h3>Experiment created!</h3><p>You will find your results in the following URL, <strong>copy this link somewhere!</strong></p> \
            <p></p> \
            <p><a href='results/"+options["id"]+"/'>https://www.psyphy.org/results/"+options["id"]+"/</a></p>");
          

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
        if(fileReader)
            data=fileReader.readAsText($('#load-experiment').prop('files')[0]);
        //console.log(data);
    });

    $("#ratings").on('mousemove',function(){
        r=$(this).val();
        if(r==1)
            r="disabled";
        $("#slider-value").html(r);  
    });
    
    $(document).key('ctrl+shift+f', function() {
        cheatCode=true;
        if ($('#cheatcode').length === 0) {
            $("body").append("<div id='cheatcode'><i class='fas fa-bug'></i></div>");
            $("#cheatcode").slideDown(200).css('display', 'flex');
        }
    });

    $(".form-box #create-title").click(function(){
        $("#create-toggle").toggle();
        $("#create-title").children(".icon").toggleClass("fas fa-plus-square");
        $("#create-title").children(".icon").toggleClass("far fa-minus-square");
    });

});