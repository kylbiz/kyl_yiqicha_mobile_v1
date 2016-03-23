Template.searchRegistrationResults.helpers({
  "keywords": function() {
    return Session.get("keywords") || "";
  },
  "readyflag": function() {
    var readyflag = false;
    var uuid = Session.get("uuid");
    var registrationLength = Session.get("registrationLength");
    if(registrationLength > 0) {
      return true;
    } else {
      var searchrecords = CompanySearchRecords.findOne({
        'uuid': uuid
      });
      if(searchrecords && searchrecords.hasOwnProperty("readyflag")) {
        readyflag = searchrecords.readyflag;
      }
      return readyflag;
    }
  }
})