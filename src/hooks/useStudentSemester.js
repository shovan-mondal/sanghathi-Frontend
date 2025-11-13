import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Custom hook to fetch student's current semester from admission details
 * @returns {Object} { semester: number|null, loading: boolean }
 */
export const useStudentSemester = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get('menteeId');
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemester = async () => {
      try {
        const userId = menteeId || user?._id;
        if (!userId) {
          console.log('[useStudentSemester] No userId available');
          setLoading(false);
          return;
        }

        console.log('[useStudentSemester] Fetching semester for userId:', userId);

        // Fetch admission details to get current semester
        const response = await axios.get(
          `${BASE_URL}/v1/admissions/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        console.log('[useStudentSemester] Admission response:', response.data);

        const admissionData = response.data.data?.admissionDetails;
        if (admissionData?.semester) {
          // Convert semester string (e.g., "5th") to number (e.g., 5)
          const semesterNumber = parseInt(admissionData.semester.replace(/\D/g, ''), 10);
          console.log('[useStudentSemester] Setting semester:', semesterNumber, 'from', admissionData.semester);
          setSemester(semesterNumber);
        } else {
          console.log('[useStudentSemester] No semester found in admission data');
        }
      } catch (error) {
        console.error('[useStudentSemester] Error fetching student semester:', error);
        // Don't show error to user, just use default semester
      } finally {
        setLoading(false);
      }
    };

    fetchSemester();
  }, [user?._id, menteeId]);

  return { semester, loading };
};

export default useStudentSemester;
