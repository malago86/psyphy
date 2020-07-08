var selecting_folder=0;
var folder_ids=[];
var loading=false;
$( document ).ready(function() {
  $("#google-drive-select").click(function(){
    $("#google-drive-dialog").show();
    $(".background").css("filter","blur(4px)");
    $(".background").css("opacity",".4");
    //$("#google-drive-dialog")
  });
  $("#google-drive-submit").click(function(){
    folder_ids=[];
    $.getJSON( "php/getFiles.php", { "drive-folder-id": $("#google-drive-url").val()} )
    .done(function( data ) {
      //console.log(data.length,data);
      var html="<h2>Select the folder for condition #1</h2><ul>";
      for(f=0;f<data.length;f++){
        html+="<li google-folder-id="+data[f].id+">"+data[f].name+"<span class='files-found'></span></li>";
      }
      html+="</ul>"
      //console.log(html);
      selecting_folder=1;
      $("#google-drive-result").html(html);
    });
  });
  $('body').on('click', "#google-drive-result ul li",function(e) {
    if(selecting_folder!=0 && !loading){
      selecting_folder++;
      $("#google-drive-result h2").html("Select the folder for condition #"+selecting_folder);
      
      var thisElement=$(this);
      var folderName=thisElement.text();
      
      $.getJSON( "php/getFiles.php", { "drive-folder-id": thisElement.attr("google-folder-id")} )
      .done(function( data ) {
        //console.log(data.length,data);
        //thisElement.children(".files-found").html();
        
        folder_ids.push({name:folderName,
          id:thisElement.attr("google-folder-id"),
          stimuli:{infoFiles:[],feedbackFiles:[],stimulusFiles:[]}
        });
        //thisElement.css("background-color","green");
        loading=true;
        getStimuli(data, folder_ids.length-1, thisElement);
        loading=false;
      });
      thisElement.children(".files-found").html('<i class="fas fa-hourglass fa-spin"></i>&nbsp;&nbsp;&nbsp;<span> Loading...</span>')
      thisElement.css("background-color","#004400");
    }
  });
  $("#google-drive-dialog .button").click(function(){
    cancelPopup(null);
    arr.config.conditions=folder_ids;
    var count=0;
    for(i=0;i<arr.config.conditions.length;i++)
    count+=arr.config.conditions[i].stimuli.stimulusFiles.length;
    $("#create-experiment").removeClass("disabled");
  });
});

function getStimuli(data, id, thisElement){
  for(i=0;i<data.length;i++){
    $.getJSON( "php/getFiles.php", { "drive-file-id": data[i].id} )
    .done(function( dataIn ) {
      stimulusImages=[];
      for(j=0;j<dataIn.length;j++){
        if(dataIn[j].name.includes(".json"))
        folder_ids[id].stimuli.infoFiles[folder_ids[id].stimuli.stimulusFiles.length]=dataIn[j];
        else if(dataIn[j].name.includes("feedback"))
        folder_ids[id].stimuli.feedbackFiles[folder_ids[id].stimuli.stimulusFiles.length]=dataIn[j];
        else
        stimulusImages.push(dataIn[j]);
      }
      folder_ids[id].stimuli.stimulusFiles.push(stimulusImages);
      if (folder_ids[id].stimuli.stimulusFiles.length<data.length){
        thisElement.children(".files-found").children("span").html(folder_ids[id].stimuli.stimulusFiles.length+" stimuli found");
      }
      else{
        thisElement.children(".files-found").html('<i class="fas fa-check-square"></i>&nbsp;&nbsp;&nbsp;'+data.length+" stimuli found");
        thisElement.css("background-color","green");
      }
    });
  }
}
// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    $.getJSON("/credentials/client_id.json",function( data ) {
        var CLIENT_ID = data["client_id"];
        var API_KEY = data["api_key"];
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            
            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    
        }, function(error) {
            console(JSON.stringify(error, null, 2));
        });
    });
    
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        $("#authorize_button").hide();
        $("#signout_button").show();
    } else {
        $("#authorize_button").show();
        $("#signout_button").hide();
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function after_load(list, list_length, stimuli, i, data){
    
    if(list.name.includes("mp4") || list.name.includes("webm")){
    stimuli.img[i]=document.createElement("video");
    stimuli.img[i].autoplay = true;
    //stimuli.img[i].setAttribute("controls","controls");
    }else{
    stimuli.img[i]=new Image();
    stimuli.img[i].stimId=i;
    stimuli.img[i].stimMax=list.length;
    }
    stimuli.img[i].setAttribute("class","stimulus-img");
    stimuli.img[i].setAttribute("numImg",i+1);
    stimuli.img[i].src = 'data:image/jpeg;base64,' + btoa(data.body);
    moveLoadingBar(stimuli.img.length-1,list_length);
    if(MAFC){
    $("#stimulus").append(stimuli.img[i]);
    }else if(i==0){
        $("#stimulus .stimulus-img").replaceWith(stimuli.img[0]);
    }
}

function load_stimuli_drive_js(list,info,feedback){
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
        if(!calibrated && !("text" in stimuli.info))
        stimuli.info.text="Recalibration finished. Press SPACEBAR to continue";
        if(stimuli.info.text && preparation==false){
        $("#trial-container .text").css( "display", "table" );
        $("#trial-container .text div").html(stimuli.info.text);
        preparation=true;
        }else{
        $("#stimulus-container").show();
        }
        loadingInfo=false;
    }).fail(function(data) {
        loadingInfo=false;
        $("#stimulus-container").show();
    });
    }
    
    for(i=0;i<list.length;i++){
        setTimeout(function(i){
            f=gapi.client.drive.files.get({fileId:list[i].id,alt: "media"}).then(after_load.bind(null,list[i], list.length, stimuli, i),
            function(error){
                console.log("error!",error);
            });
        }, i*111, i);
        
    }
    if(MAFC){
        stimuli.slices=1;
        $("#stimulus").randomize(".stimulus-img");
    }else{
        stimuli.slices=list.length;
        $("#stimulus").append(stimuli.img[0]);
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