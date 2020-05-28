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