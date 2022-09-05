import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";

import Layout from "../components/Layout";
import AdminCard from "../components/AdminCard";
import LineChart from "../components/LineChart";
import DownloadChart from "../components/DownloadChart";
import VisitorSearchResults from "../components/VisitorSearchResults";

import useDateRange from "../hooks/useDateRange.hook";
import useAuth from "../store/authStore";

import { AiOutlinePlus, AiOutlineMinus, AiOutlineCar } from "react-icons/ai";
import { BiBuildingHouse, BiMailSend } from "react-icons/bi";
import { FaSearch, FaCarSide, FaPeopleArrows } from "react-icons/fa";
import {
    MdBlock,
    MdDataSaverOn,
    MdDataSaverOff,
    MdOutlineCancel,
} from "react-icons/md";

// Returns string in format yyyy-mm-dd given Date Object
const getFormattedDateString = (date) => {
    if (date instanceof Date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return [
            date.getFullYear(),
            (month > 9 ? "" : "0") + month,
            (day > 9 ? "" : "0") + day,
        ].join("-");
    }
};

const AdminDashboard = () => {
    // NextJS Page Router
    const router = useRouter();

    // Number of invites sent state
    const [numInvitesSent, setNumInvitesSent] = useState(0);

    const [hoursMenu, setHours] = useState(0);
    const [minutesMenu, setMinutes] = useState(0);

    // Visitor invite data object for chart
    const [visitorVals, setVisitorVals] = useState({
        data: [],
        labels: [],
        label: "Invites",
    });

    // Parking data object for chart
    const [parkingVals, setParkingVals] = useState({
        data: [],
        labels: [],
        label: "Parking",
    });

    // Predicted Visitor Values
    const [predictedVisitorVals, setPredictedVisitorVals] = useState([]);
    const [predictedParkingVals, setPredictedParkingVals] = useState([]);

    // Date Range Hook
    const [startDate, endDate, inviteDateMap, setDateMap] = useDateRange(
        getFormattedDateString(new Date(Date.now())),
        7
    );

    // Parking Date Range Hook
    const [
        parkingStartDate,
        parkingEndDate,
        parkingDateMap,
        setParkingDateMap,
    ] = useDateRange(getFormattedDateString(new Date(Date.now())), 7);

    // Start Date State
    const [start, setStart] = useState(startDate);

    // Initial number of invites per resident for fallback
    const [initialNumInvitesPerResident, setInitialNumInvitesPerResident] =
        useState(1);

    const [initialCurfewTime, setInitialCurfewTime] = useState(1);

    const [initialNumParkingSpots, setInitialNumParkingSpots] = useState(0);

    const [numParkingSpotsAvailableToday, setNumParkingSpotsAvailableToday] =
        useState(0);

    // State to track whether the restrictions have changed
    const [restrictionsChanged, setRestrictionsChanged] = useState(false);

    // State for invites for today
    const [todayInvites, setTodayInvites] = useState(0);

    // Search visitor name state
    const [name, setName] = useState("");

    // Average values for week
    const [avgVisitors, setAvgVisitors] = useState(0);
    const [avgParking, setAvgParking] = useState(0);

    // Cancellations for the week
    const [numCancel, setNumCancel] = useState(0);

    const now = getFormattedDateString(new Date());

    const [numParkingSpotsAvailable, setNumParkingSpotsAvailable] = useState(0);

    // JWT Token data from Model
    const decodedToken = useAuth((state) => {
        return state.decodedToken;
    })();

    const numInvitesPerResidentQuery = useQuery(gql`
        query {
            getNumInvitesPerResident {
                value
            }
        }
    `);

    const CurfewTimeQuery = useQuery(gql`
        query {
            getCurfewTime {
                value
            }
        }
    `);

    // Number of invites per resident state
    const [numInvitesPerResident, setNumInvitesPerResident] = useState(1);
    const [curfewTime, setCurfewTime] = useState(1);

    const [defaultHours, setDefaultHours] = useState(0);
    const [defaultMins, setDefaultMins] = useState(0);

    const numInvitesQuery = useQuery(gql`
        query {
            getTotalNumberOfVisitors
        }
    `);

    const numParkingSpotsAvailableQuery = useQuery(gql`
         query {
            getTotalAvailableParking
        }
    `);

    const numInviteInDateRangeQuery = useQuery(
        gql`
        query {
            getNumInvitesPerDate(
                dateStart: "${start}",
                dateEnd: "${endDate}"
            ) {
                inviteDate
                inviteState
            }
        }
    `,
        { fetchPolicy: "no-cache" }
    );

    const numParkingInDateRangeQuery = useQuery(gql`
        query {
            getUsedParkingsInRange(startDate: "${parkingStartDate}", endDate: "${parkingEndDate}") {
                reservationDate
            }
        }
    `);

    const predictedInvitesQuery = useQuery(gql`
        query {
          getPredictedInviteData(startDate: "${startDate}", endDate: "${endDate}") {
            date
            parking,
            visitors
          }
        }
    `);

    const [setNumInvitesPerResidentMutation, { data, loading, error }] =
        useMutation(gql`
        mutation {
          setNumInvitesPerResident(numInvites: ${numInvitesPerResident}) {
            value
          }
        }
    `);
    const [adjustParkingMutation, { }] =
        useMutation(gql`
       mutation {
        adjustParking(numDisiredParkingTotal: ${numParkingSpotsAvailable}) 
       }
   `);

    const client = useApolloClient();
    function curfewMutationFunc(CURFEW) {

        client.mutate({
            mutation: gql`
        mutation {
          setCurfewTime(curfewTime: ${CURFEW}) {
            value
          }
        }
    `});
    }



    const cancelRestrictions = () => {
        setNumInvitesPerResident(initialNumInvitesPerResident);
        setNumParkingSpotsAvailable(initialNumParkingSpots);
        setInitialCurfewTime(initialCurfewTime);
        setRestrictionsChanged(false);
    };

    const saveRestrictions = () => {

        if (numInvitesPerResident !== initialNumInvitesPerResident) {
            setInitialNumInvitesPerResident(numInvitesPerResident);
            setNumInvitesPerResidentMutation();
        }

        if (numParkingSpotsAvailable !== initialNumParkingSpots) {
            setInitialNumParkingSpots(numParkingSpotsAvailable);
            adjustParkingMutation();
            setNumParkingSpotsAvailableToday(
                numParkingSpotsAvailable - parkingDateMap.get(parkingStartDate)
            );
        }


        if (minutesMenu == "1") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "2") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "3") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "4") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "5") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "6") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "7") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "8") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "9") {
            minutesMenu = "0" + minutesMenu;
        } else if (minutesMenu == "0") {
            minutesMenu = "0" + minutesMenu;
        }

        if (hoursMenu == "0") {
            hoursMenu = "0" + hoursMenu;
        }

        let temp = hoursMenu + minutesMenu;
        
        let numTemp = parseInt(temp);
        setCurfewTime(numTemp);


        if (numTemp !== "7777") {
            setInitialCurfewTime(curfewTime);
            curfewMutationFunc(numTemp);
        }

        setDefaultHours(hoursMenu);
        setDefaultMins(minutesMenu);
        

        setRestrictionsChanged(false);
    };

    useEffect(() => {
        // Num invites
        if (!numInvitesQuery.loading && !numInvitesQuery.error) {
            const invites = numInvitesQuery.data.getTotalNumberOfVisitors;
            setNumInvitesSent(invites);
        } else if (numInvitesQuery.error) {
            if (numInvitesQuery.error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }
        }

        // Num invites in range
        if (
            !numInviteInDateRangeQuery.loading &&
            !numInviteInDateRangeQuery.error
        ) {
            const invites = numInviteInDateRangeQuery.data.getNumInvitesPerDate;
            let numCancelled = 0;
            invites.forEach((invite) => {
                if (invite.inviteState === "cancelled") {
                    numCancelled++;
                } else if (!isNaN(inviteDateMap.get(invite.inviteDate))) {
                    inviteDateMap.set(
                        invite.inviteDate,
                        inviteDateMap.get(invite.inviteDate) + 1
                    );
                }
            });

            setNumCancel(numCancelled);
            setAvgVisitors(invites.length / 7);

            setDateMap(new Map(inviteDateMap));
            setVisitorVals({
                data: Array.from(inviteDateMap.values()),
                labels: Array.from(inviteDateMap.keys()),
                label: "Invites",
            });

            setTodayInvites(inviteDateMap.get(startDate));
        } else if (numInviteInDateRangeQuery.error) {
            console.error(numInviteInDateRangeQuery.error);
        }

        // Num parking in range
        if (
            !numParkingInDateRangeQuery.loading &&
            !numParkingInDateRangeQuery.error
        ) {
            const parkingNumbers =
                numParkingInDateRangeQuery.data.getUsedParkingsInRange;

            parkingNumbers.forEach((parking) => {
                if (!isNaN(parkingDateMap.get(parking.reservationDate))) {
                    parkingDateMap.set(
                        parking.reservationDate,
                        parkingDateMap.get(parking.reservationDate) + 1
                    );
                }
            });

            setAvgParking(parkingNumbers.length / 7);

            setParkingDateMap(new Map(parkingDateMap));
            setParkingVals({
                labels: Array.from(parkingDateMap.keys()),
                data: Array.from(parkingDateMap.values()),
                label: "Parking",
            });
        } else if (numParkingInDateRangeQuery.error) {
            console.error(numParkingInDateRangeQuery.error);
        }

        // Parking spots available
        if (
            !numParkingSpotsAvailableQuery.loading &&
            !numParkingSpotsAvailableQuery.error
        ) {
            const numParkingspots =
                numParkingSpotsAvailableQuery.data.getTotalAvailableParking;
            setNumParkingSpotsAvailable(numParkingspots);
            setInitialNumParkingSpots(numParkingspots);
            setNumParkingSpotsAvailableToday(
                numParkingSpotsAvailable - parkingDateMap.get(parkingStartDate)
            );
        } else if (numParkingSpotsAvailableQuery.error) {
            setNumParkingSpotsAvailable("Error");
        }

        if (
            !numInvitesPerResidentQuery.loading &&
            !numInvitesPerResidentQuery.error
        ) {
            setNumInvitesPerResident(
                numInvitesPerResidentQuery.data.getNumInvitesPerResident.value
            );
            setInitialNumInvitesPerResident(numInvitesPerResident);
        } else if (numInvitesPerResident.error) {
        }


    }, [
        numInvitesQuery,
        numInviteInDateRangeQuery,
        numParkingInDateRangeQuery,
        numParkingSpotsAvailableQuery,
        setParkingVals,
        setNumParkingSpotsAvailable,
        numInvitesPerResidentQuery,

    ]);

    useEffect(() => {
        if (!predictedInvitesQuery.loading && !predictedInvitesQuery.error) {
            const predictedVisitors = [];
            const predictedParking = [];
            predictedInvitesQuery.data.getPredictedInviteData.forEach(
                (invite) => {
                    predictedVisitors.push(invite.visitors);
                    predictedParking.push(invite.parking);
                }
            );

            setPredictedVisitorVals(predictedVisitors);
            setPredictedParkingVals(predictedParking);
        }
    }, [predictedInvitesQuery]);

    function populateCurfew(){
        if (!CurfewTimeQuery.loading && !CurfewTimeQuery.error) {
            const curfew = CurfewTimeQuery.data.getCurfewTime.value;
            let tempH;
            let tempM;
            if (curfew == "0") {
                tempH = "00";
                tempM = "00";
            } else {
                let tempCurfew = String(curfew);
                if (tempCurfew.length == 3) {
                    tempCurfew = "0" + tempCurfew;
                }
                tempH = tempCurfew.substring(0, 2);
                tempM = tempCurfew.substring(2, 4);
            }
            setDefaultHours(tempH);
            setDefaultMins(tempM);
        }
    }

    useEffect(() => {
        populateCurfew();
    }, [CurfewTimeQuery]);

    return (
        <Layout>
            <div className="mb-3 space-y-3 px-3">
                <div className="flex flex-col items-center justify-between md:flex-row">
                    <div className="flex-col">
                        <h1 className="mt-4 mb-4 text-3xl font-bold">
                            <span className="">Hi</span>{" "}
                            <span className="text-secondary">
                                {decodedToken.name}
                            </span>
                            <span>👋</span>
                        </h1>
                        <p className="text-slate-500">
                            View and Manage System State
                        </p>
                    </div>

                    <div>
                        <div className="input-group">
                            <input
                                onChange={(e) => {
                                    setName(e.target.value);
                                }}
                                type="text"
                                placeholder="Search…"
                                className="input input-bordered"
                            />
                            <label
                                htmlFor="visitor-modal"
                                className="btn btn-square"
                            >
                                <FaSearch />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 grid-rows-1 space-y-3">
                    <div className="stats stats-vertical w-full shadow lg:stats-horizontal">
                        <AdminCard
                            description="Total Number Of Invites For Today"
                            Icon={BiBuildingHouse}
                            dataval={todayInvites}
                            unit="Today"
                        />
                        <AdminCard
                            description="Total Number Of Invites Sent"
                            Icon={BiMailSend}
                            dataval={numInvitesSent}
                            unit="Today"
                        />
                        <AdminCard
                            description="Number Of Parking Spots Available"
                            Icon={AiOutlineCar}
                            dataval={numParkingSpotsAvailableToday}
                            unit="Today"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-secondary-content md:grid-cols-2">
                        <DownloadChart
                            title={"Visitor Forecast For The Week"}
                            filename="visitor-forecast.png"
                            Chart={LineChart}
                            labelvals={visitorVals.labels}
                            datavals={[
                                visitorVals.data,
                                predictedVisitorVals,
                                parkingVals.data,
                                predictedParkingVals
                            ]}
                            datalabels={[
                                visitorVals.label,
                                "Predicted Visitors",
                                parkingVals.label,
                                "Predicted Parking"
                            ]}
                        />
                        <div className="stats stats-vertical bg-base-200 shadow">
                            <div className="stat">
                                <div className="stat-figure">
                                    <MdOutlineCancel className="text-2xl md:text-4xl" />
                                </div>
                                <div className="stat-title">Cancellations</div>
                                <div className="stat-value">{numCancel}</div>
                                <div className="stat-desc">
                                    For week {startDate} - {endDate}
                                </div>
                            </div>
                            <div className="stat">
                                <div className="stat-figure">
                                    <FaPeopleArrows className="text-2xl md:text-3xl" />
                                </div>
                                <div className="stat-title">
                                    Average Visitors per day
                                </div>
                                <div className="stat-value">
                                    {Math.ceil(avgVisitors)}
                                </div>
                                <div className="stat-desc">
                                    For week {startDate} - {endDate}
                                </div>
                            </div>
                            <div className="stat">
                                <div className="stat-figure">
                                    <FaCarSide className="text-2xl md:text-3xl" />
                                </div>
                                <div className="stat-title">
                                    Average Parking Reservations per day
                                </div>
                                <div className="stat-value">
                                    {Math.ceil(avgParking)}
                                </div>
                                <div className="stat-desc">
                                    For week {startDate} - {endDate}
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1 className="flex flex-col items-center justify-center space-x-3 text-2xl font-bold lg:flex-row">
                        <span className="mr-3 text-xl text-primary md:text-3xl">
                            <MdBlock />
                        </span>{" "}
                        System Restrictions
                        <div className="flex items-center">
                            {restrictionsChanged && (
                                <div className="flex space-x-1">
                                    <button
                                        onClick={saveRestrictions}
                                        className="btn btn-primary btn-sm space-x-3 lg:btn-md"
                                    >
                                        <span>
                                            <MdDataSaverOn className="mr-3 text-xl" />
                                        </span>{" "}
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={cancelRestrictions}
                                        className="btn btn-secondary btn-sm space-x-3 lg:btn-md"
                                    >
                                        <span>
                                            <MdDataSaverOff className="mr-3 text-xl" />
                                        </span>{" "}
                                        Cancel Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </h1>



                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Invites Per Resident{" "}
                                    <div className="badge badge-secondary">
                                        Resident
                                    </div>
                                </h2>
                                <p>
                                    Number of invites a resident is allowed to
                                    have open/sent at a time.
                                </p>
                                <div className="card-actions flex items-center justify-start">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            data-testid="increaseInvites"
                                            className="btn btn-circle"
                                            onClick={() => {
                                                setNumInvitesPerResident(
                                                    numInvitesPerResident + 1
                                                );
                                                setRestrictionsChanged(true);
                                            }}
                                        >
                                            <AiOutlinePlus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                        <p
                                            id="numInvitesPerResident"
                                            className="text-4xl font-bold text-secondary"
                                        >
                                            {numInvitesPerResident}
                                        </p>
                                        <button
                                            data-testid="decreaseInvites"
                                            className="btn btn-circle"
                                            onClick={() => {
                                                numInvitesPerResident > 1 &&
                                                    setNumInvitesPerResident(
                                                        numInvitesPerResident -
                                                        1
                                                    );
                                                setRestrictionsChanged(true);
                                            }}
                                        >
                                            <AiOutlineMinus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Parking Spots Available{" "}
                                    <div className="badge badge-secondary">
                                        User
                                    </div>
                                </h2>
                                <p>
                                    Number of parking spots left in the
                                    building.
                                </p>
                                <div className="card-actions flex items-center justify-start">
                                    <div className="flex items-center space-x-3">

                                        <button className="btn btn-circle" onClick={() => {
                                            setNumParkingSpotsAvailable(numParkingSpotsAvailable + 1);
                                            setRestrictionsChanged(true);
                                        }}>
                                            <AiOutlinePlus className="text-xl md:text-2xl lg:text-3xl" />

                                        </button>
                                        <p
                                            id="numParkingSpotsAvailable"
                                            className="text-4xl font-bold text-secondary"
                                        >
                                            {numParkingSpotsAvailable}
                                        </p>

                                        <button className="btn btn-circle" onClick={() => {
                                            if (numParkingSpotsAvailable > 0) {
                                                setNumParkingSpotsAvailable(numParkingSpotsAvailable - 1);
                                            }

                                            setRestrictionsChanged(true);
                                        }}>
                                            <AiOutlineMinus className="text-xl md:text-2xl lg:text-3xl" />

                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Curfew Time{" "}
                                    <div className="badge badge-secondary">
                                        Visitor
                                    </div>
                                </h2>
                                <p>
                                    Current curfew: {defaultHours}:{defaultMins}
                                </p>

                                <div className="card-actions flex items-center justify-start">
                                    <div className="flex items-center justify-center">

                                        <select className="select select-bordered select-secondary mx-5" name="hours" id="hours" onChange={(e) => {
                                            
                                            setHours(e.target.value);

                                            setRestrictionsChanged(true);
                                        }}>
                                            <option value="0">00</option>
                                            <option value="1">01</option>
                                            <option value="2">02</option>
                                            <option value="3">03</option>
                                            <option value="4">04</option>
                                            <option value="5" >05</option>
                                            <option value="6">06</option>
                                            <option value="7">07</option>
                                            <option value="8">08</option>
                                            <option value="9">09</option>
                                            <option value="10">10</option>
                                            <option value="11">11</option>
                                            <option value="12">12</option>
                                            <option value="13">13</option>
                                            <option value="14">14</option>
                                            <option value="15">15</option>
                                            <option value="16">16</option>
                                            <option value="17">17</option>
                                            <option value="18">18</option>
                                            <option value="19">19</option>
                                            <option value="20">20</option>
                                            <option value="21">21</option>
                                            <option value="22">22</option>
                                            <option value="23">23</option>
                                        </select>
                                        <h1>    :    </h1>
                                        <select className="select select-bordered select-secondary mx-5" name="minutes" id="minutes" onChange={(e) => {
                                            
                                            setMinutes(e.target.value);
                                            setRestrictionsChanged(true);
                                        }}>
                                            <option value="00">00</option>
                                            <option value="1">01</option>
                                            <option value="2">02</option>
                                            <option value="3">03</option>
                                            <option value="4">04</option>
                                            <option value="5">05</option>
                                            <option value="6">06</option>
                                            <option value="7">07</option>
                                            <option value="8">08</option>
                                            <option value="9">09</option>
                                            <option value="10">10</option>
                                            <option value="11">11</option>
                                            <option value="12">12</option>
                                            <option value="13">13</option>
                                            <option value="14">14</option>
                                            <option value="15">15</option>
                                            <option value="16">16</option>
                                            <option value="17">17</option>
                                            <option value="18">18</option>
                                            <option value="19">19</option>
                                            <option value="20">20</option>
                                            <option value="21">21</option>
                                            <option value="22">22</option>
                                            <option value="23">23</option>
                                            <option value="24">24</option>
                                            <option value="25">25</option>
                                            <option value="26">26</option>
                                            <option value="27">27</option>
                                            <option value="28">28</option>
                                            <option value="29">29</option>
                                            <option value="30">30</option>
                                            <option value="31">31</option>
                                            <option value="32">32</option>
                                            <option value="33">33</option>
                                            <option value="34">34</option>
                                            <option value="35">35</option>
                                            <option value="36">36</option>
                                            <option value="37">37</option>
                                            <option value="38">38</option>
                                            <option value="39">39</option>
                                            <option value="40">40</option>
                                            <option value="41">41</option>
                                            <option value="42">42</option>
                                            <option value="43">43</option>
                                            <option value="44">44</option>
                                            <option value="45">45</option>
                                            <option value="46">46</option>
                                            <option value="47">47</option>
                                            <option value="48">48</option>
                                            <option value="49">49</option>
                                            <option value="50">50</option>
                                            <option value="51">51</option>
                                            <option value="52">52</option>
                                            <option value="53">53</option>
                                            <option value="54">54</option>
                                            <option value="55">55</option>
                                            <option value="56">56</option>
                                            <option value="57">57</option>
                                            <option value="58">58</option>
                                            <option value="59">59</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="modal" id="parking-modal">
                <div className="modal-box space-y-2">
                    <h3 className="text-md font-bold md:text-lg">
                        Update Number of Parking Spots Available
                    </h3>
                    <input
                        onChange={(e) => {
                            return updateParkingSpots(Number(e.target.value));
                        }}
                        className="input input-bordered w-full max-w-xs"
                        type="number"
                        placeholder={numParkingSpotsAvailable}
                    />
                    <div className="modal-action">
                        <a href="#" className="btn">
                            Update
                        </a>
                    </div>
                </div>
            </div>
            <input
                type="checkbox"
                id="visitor-modal"
                className="modal-toggle"
                onChange={(e) => {
                    setName(e.target.value);
                }}
                value={name}
            />
            <label htmlFor="visitor-modal" className="modal cursor-pointer">
                <label className="modal-box relative" htmlFor="">
                    <VisitorSearchResults query={name} />
                </label>
            </label>
        </Layout>
    );
};

export async function getStaticProps(context) {
    return {
        props: {
            protected: true,
            permission: 0,
        },
    };
}

export default AdminDashboard;
