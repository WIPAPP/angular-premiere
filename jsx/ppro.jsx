function renderSequence(presetPath, outputPath, useInOutPoints) {
  app.enableQE();
  var jobID = undefined;

  var activeSequence = qe.project.getActiveSequence();
  if (activeSequence != undefined) {
    app.encoder.launchEncoder();

    function onEncoderJobComplete(jobID, outputFilePath) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";
      if (typeof JSON !== 'object') {
          eventObj.data = "{\"type\": \"complete\",\"jobID\": jobID,\"outputFilePath\": outputFilePath}";
      } else {
          eventObj.data = JSON.stringify({
              'type': 'complete',
              'jobID': jobID,
              'outputFilePath': outputFilePath
          });
      }

      eventObj.dispatch();
    }

    function onEncoderJobError(jobID, errorMessage) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";
      if (typeof JSON !== 'object') {
          eventObj.data = "{\"type\": \"error\",\"jobID\": jobID,\"errorMessage\": errorMessage}";
      } else {
          eventObj.data = JSON.stringify({
              'type': 'error',
              'jobID': jobID,
              'errorMessage': errorMessage
          });
      }

      eventObj.dispatch();
    }

    function onEncoderJobProgress(jobID, progress) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "se.codemill.ppro.RenderEvent";

      if (typeof JSON !== 'object') {
          eventObj.data = "{\"type\": \"progress\",\"jobID\": jobID,\"progress\": progress}";
      } else {
          eventObj.data = JSON.stringify({
              'type': 'progress',
              'jobID': jobID,
              'progress': progress
          });
      }
      eventObj.dispatch();
    }

    function onEncoderJobQueued(jobID) {
      app.encoder.startBatch();
    }

    function getEncodeSectionDescription(useInOutPoints) {
        if (useInOutPoints && useInOutPoints === "true")
        {
            return app.encoder.ENCODE_IN_TO_OUT
        }
        return app.encoder.ENCODE_ENTIRE;
    }

    var projPath = new File(app.project.path);

    var seqInPoint = app.project.activeSequence.getInPoint();	
    var seqOutPoint = app.project.activeSequence.getOutPoint();	

    if (outputPath == undefined) {
      outputPath = Folder.selectDialog("Choose the output directory").fsName;
    }

    if (outputPath != null && projPath.exists) {
      var outputPresetPath = getPresetPath(presetPath);
      var outPreset = new File(outputPresetPath);
      if (outPreset.exists == true) {

        var outputFormatExtension = activeSequence.getExportFileExtension(outPreset.fsName);

        if (outputFormatExtension != null) {
          var fullPathToFile = calculateOutputFilename(outputPath, activeSequence, outputFormatExtension);

          app.encoder.bind('onEncoderJobComplete', onEncoderJobComplete);
          app.encoder.bind('onEncoderJobError', onEncoderJobError);
          app.encoder.bind('onEncoderJobProgress', onEncoderJobProgress);
          app.encoder.bind('onEncoderJobQueued', onEncoderJobQueued);

          // use these 0 or 1 settings to disable some/all metadata creation.

          app.encoder.setSidecarXMPEnabled(0);
          app.encoder.setEmbeddedXMPEnabled(0);

          jobID = app.encoder.encodeSequence(app.project.activeSequence,
            fullPathToFile,
            outPreset.fsName,
            getEncodeSectionDescription(useInOutPoints));
          outPreset.close();
           }
      } else {
        alert("Could not find output preset.");
      }
    } else {
      alert("Could not find/create output path.");
    }
    projPath.close();
  }

  return jobID;
}

function getActiveSequence() {
  var data = {
    id : null,
    name : null
  };
  app.enableQE();
  var activeSequence = qe.project.getActiveSequence();
  if (activeSequence) {
    data = {
      'id': activeSequence.guid,
      'name': activeSequence.name
    };
  }
  if (typeof JSON !== 'object')
  {
      return '{"id":"' + activeSequence.guid + '","name": "' + activeSequence.name + '"}'
  }
  return JSON.stringify(data);
}

function calculateOutputFilename(outputPath, activeSequence, extension) {
  return outputPath + getPathSeparatorByOS() + activeSequence.name + "." + extension;
}

function getPathSeparatorByOS() {
  app.enableQE();
  if (qe === undefined || qe === null || qe.project === undefined || qe.project === null) {
    return;
  }

  if (qe.platform !== undefined && qe.platform === 'Macintosh') {
    return '/';
  } else {
    return '\\';
  }
}

function loadPluginLib() {
  var eoName;
  if (Folder.fs == 'Macintosh') {
    eoName = "PlugPlugExternalObject";
  } else {
    eoName = "PlugPlugExternalObject.dll";
  }

  try {
    new ExternalObject('lib:' + eoName);
  } catch (error) {
    alert(error);
  }
}

function getPresetPath(presetPath) {
  if (presetPath != null) {
    return presetPath;
  }
  if (Folder.fs == 'Macintosh') {
    return "/Applications/Adobe\ Premiere\ Pro\ CC\ 2015/Adobe\ Premiere\ Pro\ CC\ 2015.app/Contents/MediaIO/systempresets/58444341_4d584658/XDCAMHD\ 50\ NTSC\ 60i.epr";
  } else {
    return "C:\\Program Files\\Adobe\\Adobe Media Encoder CC 2015\\MediaIO\\systempresets\\58444341_4d584658\\XDCAMHD 50 NTSC 60i.epr";
  }
}

function clearSequenceMarkers() {
  if (app.project.activeSequence != undefined) {
    var ms = [];
    var markers = app.project.activeSequence.markers;
    for(var current_marker = 	markers.getFirstMarker();
        current_marker !=	undefined;
        current_marker =	markers.getNextMarker(current_marker)){
      ms.push(current_marker);
    }
    for (var i = 0; i < ms.length; i++) {
      markers.deleteMarker(ms[i]);
    }
  }
}

function createSequenceMarkers(inMarkers) {

  if (typeof app.project.activeSequence != "undefined" && typeof inMarkers != "undefined") {
      var json;
      if (typeof JSON !== 'object')
      {
          json = Function("return " + inMarkers + "")();
      } else {
          json = JSON.parse(inMarkers);
      }

      for (var i = 0; i < json.length; i++) {
          createSequenceMarker(json[i])
    }
  }
}

function createSequenceMarker(marker) {
    var sequenceMarkers = app.project.activeSequence.markers;
    var newMarker = sequenceMarkers.createMarker(marker.start);
    newMarker.name = marker.name;
    newMarker.comments = marker.comments.replace(/<br\s*[\/]?>/gi, '\n');
    newMarker.comments = newMarker.comments.replace(/&#39;/g, "'")
    newMarker.comments = newMarker.comments.replace(/&#47;/g, "/")
    newMarker.comments = newMarker.comments.replace(/&#92;/g, "\\");
    newMarker.comments = newMarker.comments.replace(/&#34;/g, "\"");

    newMarker.end = marker.end;

    if(typeof marker.completed !== "undefined" && marker.completed === true)
    {
        newMarker.type = "Segmentation";
    }
    //newMarker.type = getMarkerColour(index);
}

function getPathAsFile(path) {
  var file = new File(path);
  return file;
}

function getMarkerColour(index) {
    $.writeln("index: ", index);
    if (index === 1)
    {
        return "Segmentation";
    }
    if (index === 2) {
        return "Chapter";
    }
    if (index === 3) {
        return "WebLink";
    }
    return "Comment";
}

function getInMarkerPoint() {
    return app.project.activeSequence.getInPoint();
}


//var colourCounter = 1;
  //    for (var i = 0; i < json.length; i++) {
   //       if (i % 4 == 0)
   //       {
    //          colourCounter = 1
    //      }
    //      createSequenceMarker(json[i], colourCounter)
    //      colourCounter++;
   // }