/*
 * Decompiled with CFR 0.152.
 */
package util;

import com.sun.jna.Native;
import com.sun.jna.Pointer;
import com.sun.jna.Structure;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.win32.W32APIOptions;

public interface WinNative
extends Kernel32 {
    public static final WinNative INSTANCE = Native.load("kernel32", WinNative.class, W32APIOptions.DEFAULT_OPTIONS);
    public static final int FSCTL_QUERY_USN_JOURNAL = 590068;
    public static final int FSCTL_ENUM_USN_DATA = 590003;
    public static final int FSCTL_READ_USN_JOURNAL = 590011;
    public static final int FSCTL_GET_NTFS_VOLUME_DATA = 589924;
    public static final int FSCTL_GET_NTFS_FILE_RECORD = 589928;
    public static final int FSCTL_GET_REPARSE_POINT = 589992;

    @Override
    public long GetTickCount64();

    @Structure.FieldOrder(value={"RecordLength", "MajorVersion", "MinorVersion", "FileReferenceNumber", "ParentFileReferenceNumber", "Usn", "TimeStamp", "Reason", "SourceInfo", "SecurityId", "FileAttributes", "FileNameLength", "FileNameOffset", "FileName"})
    public static class USN_RECORD_V2
    extends Structure {
        public int RecordLength;
        public short MajorVersion;
        public short MinorVersion;
        public long FileReferenceNumber;
        public long ParentFileReferenceNumber;
        public long Usn;
        public long TimeStamp;
        public int Reason;
        public int SourceInfo;
        public int SecurityId;
        public int FileAttributes;
        public short FileNameLength;
        public short FileNameOffset;
        public char[] FileName = new char[1];

        public USN_RECORD_V2() {
        }

        public USN_RECORD_V2(Pointer pointer) {
            super(pointer);
            this.read();
        }

        @Override
        public void read() {
            super.read();
            if (this.FileNameLength > 0) {
                this.FileName = this.getPointer().getCharArray(this.FileNameOffset, this.FileNameLength / 2);
            }
        }

        public String getFileName() {
            return new String(this.FileName);
        }
    }

    @Structure.FieldOrder(value={"StartUsn", "LowUsn", "HighUsn"})
    public static class MFT_ENUM_DATA_V0
    extends Structure {
        public long StartUsn;
        public long LowUsn;
        public long HighUsn;
    }

    @Structure.FieldOrder(value={"UsnJournalID", "FirstUsn", "NextUsn", "LowestValidUsn", "MaxUsn", "MaximumSize", "AllocationDelta"})
    public static class USN_JOURNAL_DATA
    extends Structure {
        public long UsnJournalID;
        public long FirstUsn;
        public long NextUsn;
        public long LowestValidUsn;
        public long MaxUsn;
        public long MaximumSize;
        public long AllocationDelta;
    }

    @Structure.FieldOrder(value={"StartUsn", "ReasonMask", "ReturnOnlyOnClose", "Timeout", "BytesToWaitFor", "UsnJournalID"})
    public static class READ_USN_JOURNAL_DATA_V0
    extends Structure {
        public long StartUsn;
        public int ReasonMask;
        public int ReturnOnlyOnClose;
        public long Timeout;
        public long BytesToWaitFor;
        public long UsnJournalID;
    }

    @Structure.FieldOrder(value={"VolumeSerialNumber", "NumberSectors", "TotalClusters", "FreeClusters", "TotalReserved", "BytesPerSector", "BytesPerCluster", "BytesPerFileRecordSegment", "ClustersPerFileRecordSegment", "MftValidDataLength", "MftStartLcn", "Mft2StartLcn", "MftZoneStart", "MftZoneEnd"})
    public static class NTFS_VOLUME_DATA_BUFFER
    extends Structure {
        public long VolumeSerialNumber;
        public long NumberSectors;
        public long TotalClusters;
        public long FreeClusters;
        public long TotalReserved;
        public int BytesPerSector;
        public int BytesPerCluster;
        public int BytesPerFileRecordSegment;
        public int ClustersPerFileRecordSegment;
        public long MftValidDataLength;
        public long MftStartLcn;
        public long Mft2StartLcn;
        public long MftZoneStart;
        public long MftZoneEnd;
    }

    @Structure.FieldOrder(value={"FileReferenceNumber"})
    public static class NTFS_FILE_RECORD_INPUT_BUFFER
    extends Structure {
        public long FileReferenceNumber;
    }
}

