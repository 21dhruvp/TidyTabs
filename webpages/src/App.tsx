import React, { useEffect } from 'react';
import './App.css';
import { getNumGroups } from './getBrowserInfo.js';

function GetNewGroupName() {
  const [group, setGroup] = React.useState("");

  function handleGroupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    document.title = group;
    document.getElementById("pageHeader")!.innerHTML = group;
  }

  return (
    <form onSubmit={handleGroupSubmit}>
      <label>Change Group Name To: </label>
      <input type="text" id="gname" name="gname" className="gname" onChange={(e: React.ChangeEvent) => {setGroup((e.target as HTMLFormElement).value)}} />
      <input type="submit" id="gsubmit" name="gsubmit" className="gsubmit" value="Submit" />
    </form>);
}

function GetTabsInGroup() {
  // TODO
  return (
    <table>
    </table>
  )
}

function App() {
  useEffect(() => {
    const getData = async () => {
      return "Group " + ((await getNumGroups())-1).toString();
    };
    getData().then((data) => document.title = data);
  }, []);
  return (
    <div className="mainPage">
      <div className="header">
        <h1 id="pageHeader">New Group</h1>
        <GetNewGroupName />
      </div>
      <div className="tabList">
        <GetTabsInGroup />
      </div>
    </div> 
  );
}

export default App;
