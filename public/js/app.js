$(document).ready(function () {

    $(document).on('mouseenter', '.card', function () {

        noteDiv = $(this).find(".note");
        noteDiv.css("display","inline-block");
        // console.log(noteDiv)
    })

    $(document).on('mouseleave', '.card', function () {
        noteDiv = $(this).find(".note");
        noteDiv.css("display","none");
    })

   
    var noteDiv;
    var noteP;
    $(document).on('click', '.note', function () {
        noteDiv = $(this);
        noteP = noteDiv.find(".noteP");
        noteDiv.css("display","inline-block");

        $("#editNoteArticalName").text(noteDiv.data("title"));
        $("#noteText").val(noteDiv.data("note"));
        $('#editNote').modal('show');
        setTimeout(function (){
          $('#noteText').focus();
      }, 1000);
    })

    $(document).on('click','#refreshHeader', function(){

        $('#scrapingNews').modal('show');
        $.ajax({
            type: "GET",
            url: "/scrape"
          })
            .then(function(data) {
                window.location.href = '/';
            });
    })

    $(document).on('click','#editNoteDelete', function(e){

        e.preventDefault();

        $.ajax("/noteDelete/",{
            type: "DELETE",
            data: {
              id:  noteDiv.data("id"),
              noteId: noteDiv.data("noteid")
            }
          })
            .then(function(data) {
                noteDiv.data("note","");
                noteP.text("Add a note");
                noteP.data("noteid","");
                $('#editNote').modal('hide');
            });
    })

    $(document).on('submit', '#editNoteForm', function (e) {
        e.preventDefault();

        $.ajax("/articles/" + noteDiv.data("id"),{
            type: "POST",
            data: {
              body:  $("#noteText").val().trim(),
              oldNoteId: noteDiv.data("noteid")
            }
          })
            .then(function(data) {
                noteDiv.data("note",$("#noteText").val().trim());
                noteP.text($("#noteText").val().trim());
                noteP.data("noteid",data.note);
                $('#editNote').modal('hide');
            });
    })

})