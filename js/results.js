function loadParticipantCloud(p,experimentid,password){
    payload={"download":p,"password":password};
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
            progress=0;
            name=p.split('-').slice(0, -1).join('-');
            elem="<div class='name'><i class='fas fa-user'></i><br> #"+(num)+"</div>"+name+" <div class='date'>"+parseInt(100*data.progress)+"%</div>";
            $(".results #loading-"+num).replaceWith(elem);
        },
        error: function(data){
            console.log("ERROR");
            console.log(data["responseText"]);
            //console.log(data);
        }
    });
}