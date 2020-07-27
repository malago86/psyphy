$( document ).ready(function() {
    $('body').on('click', '.results .delete',function(e) {
        id=$(this).parent().attr('name');
        experimentid=$(".results").attr("id");
        payload={"delete":id};
        elem=$(this);
        elem.parent().parent().hide();
        $.ajax({
            type: "POST",
            data: payload,
            //dataType: "json",
            url: "/php/viewResults.php?experiment-id="+experimentid,
            success: function(data){
                //console.log(data);
                //console.log("SUCCESS",elem);
                elem.parent().parent().remove();
            },
            error: function(data){
                //console.log("ERROR",data);
                elem.parent().parent().show();
            }
        })
    });
});

function loadParticipantCloud(p){
    payload={"download":p};
    experimentid=$(".results").attr("id");
    $.ajax({
        type: "POST",
        url: "/php/viewResults.php?experiment-id="+experimentid,
        data: payload,
        dataType: "json",
        beforeSend: function(){
            num=$(".results li").length;
            elem="<li><div id='loading-"+num+"' class='loading name'><i class='fas fa-hourglass fa-spin'></i></div></li>";
            $(".results").append(elem);
        },
        success: function(data){            
            num=$(".results li").length-$(".results li .loading").length;
            name=p.split('-').slice(0, -1).join('-');
            elem="<div class='name' name='"+p+"'><div class='delete' title='Delete'><i class='fas fa-trash-alt'></i></div><i class='fas fa-user'></i><br> #"+(num+1)+"</div>"+name+" <div class='date'>"+parseInt(100*data.progress)+"%</div><div class='date'>"+data.mostRecent+"</div>";
            $(".results #loading-"+num).replaceWith(elem);
            
            if($(".results li .loading").length==0){
                $("#download-form").show();
            }
        },
        error: function(data){
            console.log("ERROR");
            console.log(data["responseText"]);
            //console.log(data);
        }
    });
}