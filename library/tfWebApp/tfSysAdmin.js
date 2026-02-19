import * as globals      from "./globals.js";
import * as utils        from "./utils.js";
import * as dialogs      from "./tfDialogs.js";


import { TFgui }         from "./tfGUI.js";
import { TFDataObject }  from "./tfDbObjects.js";

const UserDialog = {
  objName: "TFPanel",
  name: "dashBoard",
  dataFieldName: "",
  css: "cssPanel",
  backgroundColor: "rgb(204, 204, 204)",
  color: "rgb(0, 0, 0)",
  borderColor: "rgb(87, 86, 86)",
  borderWidth: "1.11111px",
  borderRadius: "2px",
  opacity: "1",
  blur: 0,
  placeItems: "stretch normal",
  justifyContent: "left",
  alignItems: "stretch",
  gridLeft: null,
  gridTop: null,
  gridWidth: null,
  gridHeight: null,
  gap: "",
  left: 4,
  top: 31,
  width: "70%",
  height: "70%",
  zIndex: "auto",
  margin: "0px",
  marginLeft: "0px",
  marginRight: "0px",
  marginTop: "0px",
  marginBottom: "0px",
  padding: "0px",
  paddingTop: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  overflow: "hidden",
  visible: true,
  display: "grid",
  position: "relative",
  flexDirection: "row",
  gridLayout: "10x10",
  children: [
    {
      objName: "TFPanel",
      name: "TFPanel190",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(136, 136, 136)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 1,
      gridWidth: 10,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 1,
      width: 10,
      height: 1,
      zIndex: "auto",
      margin: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "7x5",
      children: [
        {
          objName: "TFButton",
          name: "btnAddUser",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(95, 138, 35)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 1,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 1,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "neuer Benutzer",
          glyph: "",
          glyphColor: "",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnEditUser",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(95, 138, 35)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 2,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 2,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Benutzer bearbeiten",
          glyph: "",
          glyphColor: "",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnDeleteUser",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(128, 0, 0)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 3,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 3,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Benutzer löschen",
          glyph: "",
          glyphColor: "",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnClose",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(102, 102, 102)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 7,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 7,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Beenden",
          glyph: "",
          glyphColor: "",
          children: []
        }
      ]
    },
    {
      objName: "TFPanel",
      name: "filterPanel",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(221, 221, 221)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 2,
      gridWidth: 10,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 2,
      width: 10,
      height: 1,
      zIndex: "auto",
      margin: "1px",
      marginLeft: "1px",
      marginRight: "1px",
      marginTop: "1px",
      marginBottom: "1px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "1x1",
      children: []
    },
    {
      objName: "TFPanel",
      name: "gridContainer",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(204, 204, 204)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 3,
      gridWidth: 10,
      gridHeight: 8,
      gap: "",
      left: 1,
      top: 3,
      width: 10,
      height: 8,
      zIndex: "auto",
      margin: "1px",
      marginLeft: "1px",
      marginRight: "1px",
      marginTop: "1px",
      marginBottom: "1px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "1x1",
      children: []
    }
  ]
}


const UserDetails = {
  objName: "TFPanel",
  name: "dashBoard",
  dataFieldName: "",
  css: "cssPanel",
  backgroundColor: "rgb(237, 237, 237)",
  color: "rgb(0, 0, 0)",
  borderColor: "rgb(87, 86, 86)",
  borderWidth: "1.11111px",
  borderRadius: "2px",
  opacity: "1",
  blur: 0,
  placeItems: "stretch normal",
  justifyContent: "left",
  alignItems: "stretch",
  gridLeft: null,
  gridTop: null,
  gridWidth: null,
  gridHeight: null,
  gap: "",
  left: 4,
  top: 31,
  width: "80%",
  height: "70%",
  zIndex: "auto",
  margin: "0px",
  marginLeft: "0px",
  marginRight: "0px",
  marginTop: "0px",
  marginBottom: "0px",
  padding: "0px",
  paddingTop: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  overflow: "hidden",
  visible: true,
  display: "grid",
  position: "relative",
  flexDirection: "row",
  gridLayout: "10x20",
  children: [
    {
      objName: "TFPanel",
      name: "TFPanel1795",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(51, 51, 51)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 6,
      gridTop: 1,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 6,
      top: 1,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "2px",
      marginLeft: "2px",
      marginRight: "2px",
      marginTop: "2px",
      marginBottom: "2px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "1x1",
      children: [
        {
          objName: "TFLabel",
          name: "TFLabel1182",
          dataFieldName: "",
          css: "cssLabel",
          backgroundColor: "rgba(0, 0, 0, 0)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "0px",
          borderRadius: "0px",
          opacity: "1",
          blur: 0,
          placeItems: "center",
          justifyContent: "center",
          alignItems: "center",
          gridLeft: 1,
          gridTop: 1,
          gridWidth: 1,
          gridHeight: 1,
          gap: "",
          left: 1,
          top: 1,
          width: 1,
          height: 1,
          zIndex: "auto",
          margin: "0px",
          marginLeft: "0px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "hidden",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "1x1",
          caption: "Berechtigungen",
          textAlign: "center",
          font: "Arial",
          fontWeight: "bold",
          fontSize: "1em",
          children: []
        }
      ]
    },
    {
      objName: "TFListCheckbox",
      name: "cbListboxGrants",
      dataFieldName: "PASSWD",
      css: "cssObject",
      backgroundColor: "rgb(204, 204, 204)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 6,
      gridTop: 2,
      gridWidth: 5,
      gridHeight: 19,
      gap: "",
      left: 6,
      top: 2,
      width: 5,
      height: 19,
      zIndex: "auto",
      margin: "2px",
      marginLeft: "2px",
      marginRight: "2px",
      marginTop: "2px",
      marginBottom: "2px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "auto",
      visible: true,
      display: "block",
      position: "static",
      flexDirection: "column",
      gridLayout: "0x0",
      children: []
    },
    {
      objName: "TFPanel",
      name: "TFPanel2206",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(136, 136, 136)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 19,
      gridWidth: 5,
      gridHeight: 2,
      gap: "",
      left: 1,
      top: 19,
      width: 5,
      height: 2,
      zIndex: "auto",
      margin: "2px",
      marginLeft: "2px",
      marginRight: "2px",
      marginTop: "2px",
      marginBottom: "2px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "5x5",
      children: [
        {
          objName: "TFButton",
          name: "btnOk",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(95, 138, 35)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: 0,
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 2,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 2,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Ok",
          glyph: "",
          glyphColor: "",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnAbort",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(128, 0, 0)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: 0,
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 4,
          gridTop: 2,
          gridWidth: 1,
          gridHeight: 3,
          gap: "",
          left: 4,
          top: 2,
          width: 1,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Abbruch",
          glyph: "",
          glyphColor: "",
          children: []
        }
      ]
    },
    {
      objName: "TFEdit",
      name: "editUsername",
      dataFieldName: "USERNAME",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: 0,
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 2,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 2,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Benutzername",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editPassword",
      dataFieldName: "PASSWD",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 4,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 4,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Passwort",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editFirstName",
      dataFieldName: "FIRSTNAME",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 6,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 6,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Vorname",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editLastName",
      dataFieldName: "LASTNAME",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 8,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 8,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Nachname",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editEmail",
      dataFieldName: "EMAIL",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 10,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 10,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "e-mail",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editJobFunction",
      dataFieldName: "JOBFUNCTION",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 1,
      gridTop: 12,
      gridWidth: 5,
      gridHeight: 1,
      gap: "",
      left: 1,
      top: 12,
      width: 5,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Job-Funktion",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    }
  ]
}


const grantDlg = {
  objName: "TFPanel",
  name: "dashBoard",
  dataFieldName: "",
  css: "cssPanel",
  backgroundColor: "rgb(204, 204, 204)",
  color: "rgb(0, 0, 0)",
  borderColor: "rgb(87, 86, 86)",
  borderWidth: "1.11111px",
  borderRadius: "2px",
  opacity: "1",
  blur: 0,
  placeItems: "stretch normal",
  justifyContent: "left",
  alignItems: "stretch",
  gridLeft: null,
  gridTop: null,
  gridWidth: null,
  gridHeight: null,
  gap: "",
  left: 262,
  top: 208,
  width: "70%",
  height: "70%",
  zIndex: "auto",
  margin: "0px",
  marginLeft: "0px",
  marginRight: "0px",
  marginTop: "0px",
  marginBottom: "0px",
  padding: "0px",
  paddingTop: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  overflow: "hidden",
  visible: true,
  display: "grid",
  position: "relative",
  flexDirection: "row",
  gridLayout: "10x14",
  children: [
    {
      objName: "TFPanel",
      name: "TFPanel132",
      dataFieldName: "",
      css: ".cssContainerPanel",
      backgroundColor: "rgb(153, 153, 153)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(87, 86, 86)",
      borderWidth: "1.11111px",
      borderRadius: "0px",
      opacity: "1",
      blur: 0,
      placeItems: "stretch normal",
      justifyContent: "normal",
      alignItems: "stretch",
      gridLeft: 1,
      gridTop: 13,
      gridWidth: 10,
      gridHeight: 2,
      gap: "",
      left: 1,
      top: 13,
      width: 10,
      height: 2,
      zIndex: "auto",
      margin: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      padding: "7px",
      paddingTop: "7px",
      paddingLeft: "7px",
      paddingRight: "7px",
      paddingBottom: "7px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "relative",
      flexDirection: "row",
      gridLayout: "7x5",
      children: [
        {
          objName: "TFButton",
          name: "btnOk",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(95, 138, 35)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 2,
          gridTop: 2,
          gridWidth: 2,
          gridHeight: 3,
          gap: "",
          left: 2,
          top: 2,
          width: 2,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "OK",
          glyph: "",
          glyphColor: "",
          children: []
        },
        {
          objName: "TFButton",
          name: "btnAbort",
          dataFieldName: "",
          css: "cssButton01",
          backgroundColor: "rgb(128, 0, 0)",
          color: "rgb(255, 255, 255)",
          borderColor: "rgb(0, 0, 0)",
          borderWidth: "1.11111px",
          borderRadius: "0px",
          opacity: "1",
          blur: "blur(0px)",
          placeItems: "stretch normal",
          justifyContent: "center",
          alignItems: "stretch",
          gridLeft: 5,
          gridTop: 2,
          gridWidth: 2,
          gridHeight: 3,
          gap: "",
          left: 5,
          top: 2,
          width: 2,
          height: 3,
          zIndex: "auto",
          margin: "0px 0px 0px 4px",
          marginLeft: "4px",
          marginRight: "0px",
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0px",
          paddingTop: "0px",
          paddingLeft: "0px",
          paddingRight: "0px",
          paddingBottom: "0px",
          overflow: "visible",
          visible: true,
          display: "grid",
          position: "static",
          flexDirection: "row",
          gridLayout: "2x1",
          caption: "Abbruch",
          glyph: "",
          glyphColor: "",
          children: []
        }
      ]
    },
    {
      objName: "TFEdit",
      name: "editName",
      dataFieldName: "NAME",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 2,
      gridTop: 3,
      gridWidth: 8,
      gridHeight: 1,
      gap: "",
      left: 2,
      top: 3,
      width: 8,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Name",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editCaption",
      dataFieldName: "CAPTION",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 2,
      gridTop: 6,
      gridWidth: 8,
      gridHeight: 1,
      gap: "",
      left: 2,
      top: 6,
      width: 8,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Beschreibung",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "0",
      typ: "text",
      children: []
    },
    {
      objName: "TFEdit",
      name: "editKind",
      dataFieldName: "KIND",
      css: "cssContainerPanel",
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgb(0, 0, 0)",
      borderColor: "rgb(0, 0, 0)",
      borderWidth: "0px",
      borderRadius: "0px",
      shadow: "",
      opacity: "1",
      blur: "blur(0px)",
      placeItems: "center normal",
      justifyContent: "center",
      alignItems: "center",
      gridLeft: 2,
      gridTop: 9,
      gridWidth: 8,
      gridHeight: 1,
      gap: "",
      left: 2,
      top: 9,
      width: 8,
      height: 1,
      zIndex: "auto",
      margin: "3px",
      marginLeft: "3px",
      marginRight: "3px",
      marginTop: "3px",
      marginBottom: "3px",
      padding: "0px",
      paddingTop: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      overflow: "hidden",
      visible: true,
      display: "grid",
      position: "static",
      flexDirection: "row",
      gridLayout: "2x1",
      caption: "Intern",
      captionLength: "10",
      value: "",
      editLength: "auto",
      appendix: "",
      appendixLength: "1",
      typ: "text",
      children: []
    }
  ]
}

export class TFUser 
{
    constructor( id ) 
    { 
      this.userGrants = []; 
      var response    = {};
      if(id) response = utils.webApiRequest('LSUSERGRANTS',{userId:id} );
      else   response = utils.webApiRequest('LSGRANTS',{} );

      if(!response.error) this.userGrants = response.result;

      this.user       = new TFDataObject( "etc.user" , id || '' );
    }  

   
edit( callback_if_ready )
{
  var caption = this.user.ID ? 'Benutzer bearbeiten' : 'Benutzer anlegen';
  var gui     = new TFgui( null , UserDetails , {caption:caption});
      gui.dataBinding(  this.user );
      gui.update('GUI');

      var cbItems  = [];
      for(var i=0; i<this.userGrants.length; i++) 
      {
         var g = this.userGrants[i];
         cbItems.push({text:g.CAPTION || g.NAME, checked:g.HASGRANT==1 , name:g.NAME , id_grant:g.ID});
      } 
      
      gui.cbListboxGrants.addItems(cbItems);
   
      gui.btnAbort.callBack_onClick = function() { this.gui.close(); }.bind( {gui:gui} )

      gui.btnOk.callBack_onClick     = function(values) 
                                       { 
                                          this.gui.update('data');    
                                          this.self.user.save();
                                          this.gui.close();

                                          var saveGrants = []; 
                                          for(var i=0; i<this.self.userGrants.length; i++) 
                                            if(this.gui.cbListboxGrants.getCheckBox( i )) saveGrants.push(this.self.userGrants[i].ID)

                                          utils.webApiRequest('SETUSERGRANTSXT',{ID_user:this.self.user.ID , grants:saveGrants} );
    
                                          if(this.callBack) this.callBack() ;
                                       }.bind({self:this,gui:gui,callBack:callback_if_ready})        
                                        
  }



}


export class TFUserList
{
    constructor()
    {
      this.userList = [];
      this.selected = null;

      this.gui                              = new TFgui( null , UserDialog , {caption:"Benutzerverwaltung"});
      this.gui.btnAddUser.callBack_onClick  = function(){this.newUser()}.bind(this);
      this.gui.btnEditUser.callBack_onClick = function(){this.editUser()}.bind(this);
      //this.gui.btnDeleteUser.
      this.gui.btnClose.callBack_onClick    = function(){this.userListWnd.close()}.bind(this);
      
      this.updateView_user();
    }

    
    selectedUser(p)
    {
      this.selected = p;
    }

    
    updateView_user()
    { 
      var response = utils.webApiRequest('LSUSER' , {} );
      if(response.error) {dialogs.showMessage(response.errMsg);return; }
      this.userList = response.result;   

        this.gui.gridContainer.innerHTML = '';
        var g = dialogs.createTable(this.gui.gridContainer , this.userList , ['ID' , 'PASSWD' , 'userGrants'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedUser(jsonData) }.bind(this);
    } 
    
    
    newUser()
    {
    if(!globals.session.admin) 
      {
        dialogs.showMessage('Nur Administratoren dürfen neue Benutzer anlegen!'); 
        return;
      }  
        var u = new TFUser();
            u.edit( function(){this.updateView_user()}.bind(this) );
    } 


    editUser()
    { 
      if(!globals.session.admin) 
      {
        dialogs.showMessage('Nur Administratoren dürfen neue Benutzer bearbeiten !'); 
        return;
      }  

     if(!this.selected) {dialogs.showMessage('Bitte zuerst einen Benutzer auswählen!'); return;}

      var u = new TFUser( this.selected.ID );
          u.edit( function(){this.updateView_user()}.bind(this) );
     } 

    
}


export class TFGrant
{
    constructor( id ) 
    { 
      this.grant  = new TFDataObject( "etc.grantObj" , id || '' );
    }  

   
edit( callback_if_ready )
{
  var caption = this.grant.ID ? 'Berechtigungsobjekt bearbeiten' : 'Berechtigungsobjekt anlegen';
  var gui     = new TFgui( null , grantDlg , {caption:caption});

      gui.dataBinding(  this.grant );
      gui.update('GUI');

      gui.btnAbort.callBack_onClick = function() { this.gui.close(); }.bind( {gui:gui} )

      gui.btnOk.callBack_onClick     = function(values) 
                                       { debugger;
                                          this.gui.update('data');    
                                          this.self.grant.save();
                                          this.gui.close();
                                          if(this.callBack) this.callBack() ;
                                       }.bind({self:this,gui:gui,callBack:callback_if_ready})        
                                        
  }



}


export class TFGrantList
{
    constructor()
    {
      this.grantList = [];
      this.selected  = null;

      this.grantListtWnd = dialogs.createWindow( null,'Berechtigungs-Objekte','77%','87%','CENTER');
      this.grantListtWnd.buildGridLayout_templateColumns('1fr');
      this.grantListtWnd.buildGridLayout_templateRows   ('4em 1fr');

      // ----------------ButtonPanel + Button-----------------------------------------
      this.menuPanel    = dialogs.addPanel(this.grantListtWnd.hWnd,'',1,1,1,1);
      this.menuPanel.buildGridLayout_templateColumns('10em 10em 10em 10em 1fr 10em');
      this.menuPanel.buildGridLayout_templateRows   ('1fr');

      this.btnAddGrant    = dialogs.addButton(this.menuPanel,'',1,1,1,1,{caption:'neu',glyph:'square-plus'});
      this.btnAddGrant.height='3em';
      this.btnAddGrant.callBack_onClick = function(){this.newGrant()}.bind(this);
      
      this.btnEditGrant   = dialogs.addButton(this.menuPanel,'',2,1,1,1,{caption:'bearbeiten',glyph:'square-pen'});
      this.btnEditGrant.height='3em';
      this.btnEditGrant.callBack_onClick = function(){this.editGrant()}.bind(this);

      this.btnDeleteGrant = dialogs.addButton(this.menuPanel,'',3,1,1,1,{caption:'löschen',glyph:'square-minus'});
      this.btnDeleteGrant.height='3em';
      this.btnDeleteGrant.backgroundColor = "red";

      this.btnCloseWnd     = dialogs.addButton(this.menuPanel,'',6,1,1,1,'schließen');
      this.btnCloseWnd.callBack_onClick = function(){this.grantListtWnd.close()}.bind(this);
      this.btnCloseWnd.height='3em';
      
      //-------------------------------------------------------------------------------

      // Hilfscontainer zur Platzaufteilung                    
      var hlpContainer = dialogs.addPanel(this.grantListtWnd.hWnd,'cssContainerPanel',1,2,1,1);
          hlpContainer.buildGridLayout_templateColumns('1fr');
          hlpContainer.buildGridLayout_templateRows('2em 1fr');

      this.filterPanel      = dialogs.addPanel(hlpContainer,'',1,1,1,1);
      this.userListGridView = dialogs.addPanel(hlpContainer,'cssContainerPanel',1,2,1,1);
     
      this.updateView_grants();
    }

    
    selectedGrant(p)
    {
      this.selected = p;
    }

    
    updateView_grants()
    { 
        this.userListGridView.innerHTML = '';
        this.grantList                  = [];

        var response = utils.webApiRequest('LSGRANTS' , {} );
        if(response.error) {dialogs.showMessage(response.errMsg);return; }
        this.grantList = response.result;
        
        var g = dialogs.createTable(this.userListGridView , this.grantList , ['ID'] , [] );
        g.onRowClick=function( selectedRow , itemIndex , jsonData ) { this.selectedGrant(jsonData) }.bind(this);
    } 
    
    
    newGrant()
    {
      var u = new TFGrant('');
          u.edit(function(){this.updateView_grants()}.bind(this));
    } 


    editGrant()
    { 
     if(!this.selected) {dialogs.showMessage('Bitte zuerst Berechtigungs-Objekt auswählen!'); return;}

     var u = new TFGrant(this.selected.ID);
         u.edit(function(){this.updateView_grants()}.bind(this));
    } 

    
}


export function adminUser()
{
  new TFUserList();
}

export function adminGrants()
{
  if(!globals.session.admin)
  {
    dialogs.showMessage('Nur Administratoren dürfen Berechtigungs-Objekte anlegen oder bearbeiten!'); 
    return;
  } 

  new TFGrantList();
}
// ------------------------------------------------------------------------------------------------------------------#



