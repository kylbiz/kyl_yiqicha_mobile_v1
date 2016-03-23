
Template.registration.events({
  "click .detail": function(event) {
    var companyId = $(event.currentTarget).attr("data-companyid");
    Session.set("companyId", companyId);
    $("#RegistrationModal").modal("show");
  }
})


Template.searchRegistrationResults.events({
  "click .detail": function(event) {
    var companyId = $(event.currentTarget).attr("data-companyid");
    Session.set("companyId", companyId);
    $("#RegistrationModal").modal("show");
  }
});

Template.ReigstrationModalL.helpers({
  "credit": function() {
    var companyId = Session.get("companyId");
    return Registration.findOne({companyId: companyId});

  }
})
