Template.searchRegistration.events({
  "click .btn-kyl": function(event, template) {
    var keywords = template.$("[name=keywords]").val() || "";
    if(typeof keywords !== 'string' 
      || keywords.length < 2) {
      console.log("请正确输入至少两位字符！");
    } else {
      var uuid = Meteor.uuid()
      Router.go("/registration?keywords=" + keywords + '&uuid=' + uuid)

      Meteor.call(
        'crawlerRegistration', 
        keywords,
        uuid, 
        function(err, results) {
          if(err) {
            console.log("creaw registration error.");
            console.log(err);
          } else {
            console.log("creaw registration succeed.");
          }
        }
      );
    }
  }
});

//------------------------------------------

Template.companyStatusQuery.events({
  "click .btn": function(event, template) {
   var keywords = template.$("[name=keywords]").val() || "";
   if(typeof keywords === 'string' && keywords.length >= 2) {
      Router.go("/status?keywords=" + keywords);   
   }
 
  }
})

//------------------------------------------

Template.registrationFeedbackQuery.events({
  "click .btn": function(event, template) {

    var keywords = template.$("[name=keywords]").val() || "";
    if(typeof keywords === 'string' && keywords.length >= 2) {
      Router.go("/feedback?keywords=" + keywords);
    }

  }
})


//------------------------------------------

Template.searchRegistrationResults.events({
  "click .btn-more": function(event, template) {
    var keywords = Session.get("keywords") || "";
    var allpageNo = Session.get("allpageNo") || "";
    var currentpage = Session.get("currentpage") || 0 ;
    
    var nextpage = currentpage + 1;

    if(typeof keywords === 'string' && keywords.length >= 2  && allpageNo >= nextpage) {
      Meteor.call('getMoreRegistrations', keywords, allpageNo, nextpage);
    }
  }
});
