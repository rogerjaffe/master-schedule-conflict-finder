import { JWT } from 'google-auth-library';
import creds from './credentials.json';
import './app.css';
import { useEffect, useMemo, useState } from 'react';
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';

type SheetInfo = {
  cCode: string;
  cName: string;
  sId: string;
  sName: string;
  key: string;
};
type CourseInfo = { code: string; name: string };

export default function App() {
  const [data, setData] = useState<SheetInfo[]>([]);
  const [selectedCourses, setSelectedCourses] = useState(['', '', '']);

  useEffect(() => {
    const SHEET_ID = '1-tv8ZaDitjv8uYMcV19Mn9CREbPcS2qVVjQMTn6hIH8';
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const jwt = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: SCOPES,
    });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    doc.loadInfo().then(async () => {
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();
      const rowObjs = rows.map((row) => row.toObject());
      const rowData = rowObjs.map((row) => ({
        cCode: row['Course #'],
        cName: row['Course Name'],
        sId: row['Student #'],
        sName: row['Student Name'],
        key: row['Course #'] + ':' + row['Student #'],
      }));
      setData(rowData ?? []);
    });
  }, [creds]);

  const onChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(evt.currentTarget.getAttribute('data-idx') ?? '0');
    const _selectedCourses = [...selectedCourses];
    _selectedCourses[idx] = evt.currentTarget.value;
    setSelectedCourses(_selectedCourses);
  };

  const courseCount = useMemo(() => {
    const courseCount = data.reduce(
      (courseCount, item) => {
        if (!courseCount[item.cCode]) {
          courseCount[item.cCode] = 1;
        } else {
          courseCount[item.cCode]++;
        }
        return courseCount;
      },
      {} as { [code: string]: number },
    );
    return courseCount;
  }, [data]);
  console.log(courseCount);

  const courseQty = useMemo(() => {
    const courseArr = Object.entries(courseCount);
    const courseObj = courseArr.reduce((courseQty, item) => {
      const dept = parseInt(item[0].substring(0, 2));
      if (dept >= 55 && dept <= 59) {
        return {
          ...courseQty,
          [item[0]]: Math.max(1, Math.round(item[1] / 50)),
        };
      } else {
        return {
          ...courseQty,
          [item[0]]: Math.max(1, Math.round(item[1] / 36)),
        };
      }
    }, {});
    return courseObj;
  }, [courseCount]);
  console.log(courseQty);

  const courseList = useMemo(() => {
    if (!data) return [];
    const courseList = data.reduce((courseList, item) => {
      const courseFound = courseList.find(
        (course) => course.code === item.cCode,
      );
      if (courseFound) return courseList;
      courseList.push({ code: item.cCode, name: item.cName });
      return courseList;
    }, [] as CourseInfo[]);
    courseList.sort((a, b) => a.code.localeCompare(b.code));
    return courseList;
  }, [data]);

  const options = useMemo(() => {
    const optionsComp = courseList.map((course) => {
      return (
        <option key={course.code} value={course.code}>
          {course.code} {course.name} ({(courseQty as any)[course.code]})
        </option>
      );
    });
    optionsComp.splice(
      0,
      0,
      <option key="empty" value="">
        Select a course
      </option>,
    );
    return optionsComp;
  }, [courseList]);

  let intersect2 = [] as SheetInfo[];
  if (selectedCourses[0].length > 0 && selectedCourses[1].length > 0) {
    let sl1 = data.filter((item) => {
      return selectedCourses[0] === '' || item.cCode === selectedCourses[0];
    });
    let sl2 = data.filter((item) => {
      return selectedCourses[1] === '' || item.cCode === selectedCourses[1];
    });
    let sl3 = data.filter((item) => {
      return selectedCourses[2] === '' || item.cCode === selectedCourses[2];
    });

    const id1 = sl1.map((item) => item.sId);
    const intersect1 = sl2.filter((item) => {
      return id1.includes(item.sId);
    });
    const id3 = sl3.map((item) => item.sId);
    intersect2 = intersect1.filter((item) => {
      return id3.includes(item.sId);
    });
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1>Master Schedule Course Request Conflict Finder</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <select
            className="form-select mb-3"
            value={selectedCourses[0]}
            data-idx="0"
            onChange={onChange}
          >
            {options}
          </select>
          <select
            className="form-select mb-3"
            value={selectedCourses[1]}
            data-idx="1"
            onChange={onChange}
          >
            {options}
          </select>
          <select
            className="form-select mb-3"
            value={selectedCourses[2]}
            data-idx="2"
            onChange={onChange}
          >
            {options}
          </select>
        </div>
        <div className="col-6">
          <h5>Students in all courses ({intersect2.length})</h5>
          <ul className="list-group">
            {intersect2.map((item, idx) => {
              return (
                <li className="list-group-item" key={item.key + ':' + idx}>
                  {item.sId} {item.sName}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
