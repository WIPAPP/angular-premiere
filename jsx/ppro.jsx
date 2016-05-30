//Common
function replaceEscapedCharacters(comment) {

    comment = comment.replace(/<br\s*[\/]?>/gi, '\n');

    comment = comment.replace(/&#39;/g, "'");
    comment = comment.replace(/&#;39;/g, "'");
    comment = comment.replace(/&%23;39;/g, "'");
    comment = comment.replace(/&&%23;37;23;39;/g, "'");

    comment = comment.replace(/&#47;/g, "/");
    comment = comment.replace(/&#;47;/g, "/");
    comment = comment.replace(/&%23;47;/g, "/");

    comment = comment.replace(/&#92;/g, "\\");
    comment = comment.replace(/&#;92;/g, "\\");
    comment = comment.replace(/&%23;92;/g, "\\");

    comment = comment.replace(/&#34;/g, "\"");
    comment = comment.replace(/&#;34;/g, "\"");
    comment = comment.replace(/&%23;34;/g, "\"");
    comment = comment.replace(/&&%23;37;23;34;/g, "\"")

    comment = comment.replace(/&#37;/g, "%");
    comment = comment.replace(/&#;37;/g, "%");
    comment = comment.replace(/&%23;37;/g, "%");

    comment = comment.replace(/%20/g, " ");
    comment = comment.replace(/%0A/g, " ");
    return comment;
}

//AE
function setCurrentTimeIndicator(time) {
    app.project.activeItem.time = time
}

function getActiveItem() {
    var data = {
        id: null,
        name: null
    };
    var activeItem = app.project.activeItem;

    if (activeItem) {
        data = {
            'id': activeItem.id,
            'name': activeItem.name
        };
    };

    if (typeof JSON !== 'object' && activeItem) {
        return '{"id":"' + activeItem.id + '","name": "' + activeItem.name + '"}'
    };

    return JSON.stringify(data);
}

function setNullLayerMarkers(data) {

    if (!app.project.activeItem || !app.project.activeItem.layers) {
        return
    }

    var nullLayer = app.project.activeItem.layer("Wipster comments");

    if (nullLayer != null) {
        nullLayer.locked = false;
        nullLayer.remove();
    }

    nullLayer = app.project.activeItem.layers.addNull();
    nullLayer.name = "Wipster comments";
   
    var json;

    if (typeof JSON !== 'object') {
        json = Function("return " + data + "")();
    } else {
        json = JSON.parse(data);
    }
    for (var i = 0; i < json.length; i++) {
        var AllCommentsAtThisTime = "";
        for (var c = 0; c < json[i].comments.length; c++) {
            AllCommentsAtThisTime  += "(" + (c + 1) + ") " + json[i].comments[c]
        }
        var myMarker = new MarkerValue(replaceEscapedCharacters(AllCommentsAtThisTime));
        myMarker.duration = 1;
        nullLayer.property("Marker").setValueAtTime(json[i].start[0], myMarker);
    }

    nullLayer.locked = true;
}

//PPRO
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
          var filePath = encodeURI(outputFilePath);
          eventObj.data = '{"type": "complete","jobID": "' + jobID + '","outputFilePath": "' + filePath + '"}';
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
          eventObj.data = '{"type": "error","jobID": "' + jobID + '","errorMessage": "' + errorMessage + '"}';
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
          eventObj.data = '{"type": "progress","jobID": "' + jobID + '","progress": "' + progress +'"}';
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
  if (typeof JSON !== 'object' && activeSequence)
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

    newMarker.comments = replaceEscapedCharacters(marker.comments);

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

function setPlayerPosition(ticks) {
    if (app.project.activeSequence != undefined) {
        app.project.activeSequence.setPlayerPosition(ticks);
    }
}

function setPlayerPositionToMarker(time) {

    if (app.project.activeSequence != undefined) {
        var markers = app.project.activeSequence.markers;
        for (var current_marker = markers.getFirstMarker() ;
            current_marker != undefined;
            current_marker = markers.getNextMarker(current_marker)) {

            if (current_marker.end.seconds == time)
            {
                setPlayerPosition(current_marker.end.ticks)
            }
        }
    }
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